<script lang="ts">
  interface Props {
    dates: { date: string; count: number }[];
    lang?: string;
  }

  type RangeChoice = "rolling" | number;

  interface DateRange {
    start: Date;
    end: Date;
    selectedStart: Date;
    selectedEnd: Date;
  }

  interface Cell {
    date: string;
    count: number;
    level: number;
    row: number;
    col: number;
  }

  interface CalendarModel {
    weeks: (Cell | null)[][];
    cells: Cell[];
    monthLabels: { label: string; col: number }[];
    total: number;
    width: number;
    height: number;
    rangeLabel: string;
    rangeDates: string;
  }

  let { dates, lang = "zh-cn" }: Props = $props();

  const CELL = 10;
  const GAP = 2;
  const DAY_LABEL_WIDTH = 24;
  const BODY_LEN = 8;
  const STEP_MS = 125;

  const LIGHT = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
  const DARK = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
  const SNAKE_BODY = "#0969da";
  const SNAKE_HEAD = "#58a6ff";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const isChinese = lang.toLowerCase().startsWith("zh");
  const dayLabels = isChinese ? ["", "一", "", "三", "", "五", ""] : ["", "Mon", "", "Wed", "", "Fri", ""];

  const countMap = new Map<string, number>();
  for (const d of dates) countMap.set(d.date, d.count);

  const years = Array.from(
    new Set([
      today.getFullYear(),
      ...dates.map((item) => Number(item.date.slice(0, 4))).filter((year) => Number.isFinite(year)),
    ]),
  ).sort((a, b) => b - a);

  let selectedRange = $state<RangeChoice>("rolling");
  let snakeHead = $state(0);
  let eatenDates = $state(new Set<string>());
  let tooltip = $state<{ x: number; y: number; text: string } | null>(null);
  let canvasEl: HTMLCanvasElement;

  const calendar = $derived(buildCalendar(selectedRange));
  const snakePath = $derived(buildSnakePath(calendar));

  function cloneDate(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date: Date, days: number) {
    const next = cloneDate(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function startOfWeek(date: Date) {
    return addDays(date, -date.getDay());
  }

  function endOfWeek(date: Date) {
    return addDays(date, 6 - date.getDay());
  }

  function formatDate(date: Date) {
    return toDateKey(date);
  }

  function formatMonth(date: Date) {
    return new Intl.DateTimeFormat(lang, { month: "short" }).format(date);
  }

  function getLevel(count: number) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function getRange(choice: RangeChoice): DateRange {
    if (choice === "rolling") {
      const selectedEnd = cloneDate(today);
      const selectedStart = addDays(selectedEnd, -364);
      return {
        selectedStart,
        selectedEnd,
        start: startOfWeek(selectedStart),
        end: endOfWeek(selectedEnd),
      };
    }

    const selectedStart = new Date(choice, 0, 1);
    const selectedEnd = new Date(choice, 11, 31);
    return {
      selectedStart,
      selectedEnd,
      start: startOfWeek(selectedStart),
      end: endOfWeek(selectedEnd),
    };
  }

  function inSelectedRange(date: Date, range: DateRange) {
    return date >= range.selectedStart && date <= range.selectedEnd && date <= today;
  }

  function buildCalendar(choice: RangeChoice): CalendarModel {
    const range = getRange(choice);
    const weeks: (Cell | null)[][] = [];
    const cells: Cell[] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let total = 0;
    let current = cloneDate(range.start);
    let col = 0;
    let previousMonth = -1;

    while (current <= range.end) {
      const week: (Cell | null)[] = [];
      const weekMonthAnchor = addDays(current, 3);

      if (weekMonthAnchor.getMonth() !== previousMonth) {
        previousMonth = weekMonthAnchor.getMonth();
        monthLabels.push({ label: formatMonth(weekMonthAnchor), col });
      }

      for (let row = 0; row < 7; row += 1) {
        const date = addDays(current, row);

        if (!inSelectedRange(date, range)) {
          week.push(null);
          continue;
        }

        const dateKey = toDateKey(date);
        const count = countMap.get(dateKey) ?? 0;
        const cell: Cell = {
          date: dateKey,
          count,
          level: getLevel(count),
          row,
          col,
        };
        week.push(cell);
        cells.push(cell);
        total += count;
      }

      weeks.push(week);
      current = addDays(current, 7);
      col += 1;
    }

    const width = weeks.length * CELL + Math.max(weeks.length - 1, 0) * GAP;
    const height = 7 * CELL + 6 * GAP;
    const rangeLabel = choice === "rolling"
      ? (isChinese ? "过去 365 天" : "the last 365 days")
      : (isChinese ? `${choice} 年` : `${choice}`);

    return {
      weeks,
      cells,
      monthLabels,
      total,
      width,
      height,
      rangeLabel,
      rangeDates: `${formatDate(range.selectedStart)} - ${formatDate(range.selectedEnd)}`,
    };
  }

  function cellKey(cell: Pick<Cell, "row" | "col">) {
    return `${cell.row}:${cell.col}`;
  }

  function buildSnakePath(model: CalendarModel) {
    if (model.cells.length === 0) return [];

    const remainingFood = new Set(model.cells.filter((cell) => cell.count > 0).map((cell) => cell.date));
    const path: Cell[] = [];
    const firstFood = model.cells.find((cell) => cell.count > 0);
    let current = firstFood
      ? findEntryCell(model.cells, firstFood)
      : model.cells[0];

    path.push(current);
    if (current.count > 0) remainingFood.delete(current.date);

    let guard = model.cells.length * Math.max(remainingFood.size, 1);
    while (remainingFood.size > 0 && guard > 0) {
      const segment = findNearestFoodPath(current, remainingFood, model.cells);
      if (segment.length <= 1) break;

      for (const cell of segment.slice(1)) {
        path.push(cell);
        if (cell.count > 0) remainingFood.delete(cell.date);
      }

      current = segment[segment.length - 1];
      guard -= 1;
    }

    const loopBack = findPathToCell(current, path[0], model.cells);
    if (loopBack.length > 1) {
      path.push(...loopBack.slice(1));
    }

    return path;
  }

  function findEntryCell(cells: Cell[], firstFood: Cell) {
    const leftCol = Math.min(...cells.map((cell) => cell.col));
    const middleRow = 3;

    return cells.reduce((best, cell) => {
      const bestDistance = Math.abs(best.col - leftCol) + Math.abs(best.row - middleRow);
      const cellDistance = Math.abs(cell.col - leftCol) + Math.abs(cell.row - middleRow);
      const bestFoodDistance = Math.abs(best.col - firstFood.col) + Math.abs(best.row - firstFood.row);
      const cellFoodDistance = Math.abs(cell.col - firstFood.col) + Math.abs(cell.row - firstFood.row);

      if (cellDistance !== bestDistance) return cellDistance < bestDistance ? cell : best;
      return cellFoodDistance < bestFoodDistance ? cell : best;
    }, cells[0]);
  }

  function findNearestFoodPath(start: Cell, remainingFood: Set<string>, cells: Cell[]) {
    const cellByCoord = new Map(cells.map((cell) => [cellKey(cell), cell]));
    const startKey = cellKey(start);
    const queue: Cell[] = [start];
    const visited = new Set([startKey]);
    const parent = new Map<string, string>();
    const distance = new Map([[startKey, 0]]);
    const found: Cell[] = [];
    let foundDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const currentKey = cellKey(current);
      const currentDistance = distance.get(currentKey) ?? 0;

      if (currentDistance > foundDistance) break;
      if (currentKey !== startKey && remainingFood.has(current.date)) {
        found.push(current);
        foundDistance = currentDistance;
        continue;
      }

      for (const next of getNeighbors(current, cellByCoord)) {
        const nextKey = cellKey(next);
        if (visited.has(nextKey)) continue;
        visited.add(nextKey);
        parent.set(nextKey, currentKey);
        distance.set(nextKey, currentDistance + 1);
        queue.push(next);
      }
    }

    if (found.length === 0) return [start];

    const target = found.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (b.count !== a.count) return b.count - a.count;
      return a.date.localeCompare(b.date);
    })[0];

    return reconstructPath(start, target, parent, cellByCoord);
  }

  function findPathToCell(start: Cell, target: Cell, cells: Cell[]) {
    if (cellKey(start) === cellKey(target)) return [start];

    const cellByCoord = new Map(cells.map((cell) => [cellKey(cell), cell]));
    const startKey = cellKey(start);
    const targetKey = cellKey(target);
    const queue: Cell[] = [start];
    const visited = new Set([startKey]);
    const parent = new Map<string, string>();

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];

      for (const next of getNeighbors(current, cellByCoord)) {
        const nextKey = cellKey(next);
        if (visited.has(nextKey)) continue;

        visited.add(nextKey);
        parent.set(nextKey, cellKey(current));

        if (nextKey === targetKey) {
          return reconstructPath(start, target, parent, cellByCoord);
        }

        queue.push(next);
      }
    }

    return [start];
  }

  function getNeighbors(cell: Cell, cellByCoord: Map<string, Cell>) {
    const offsets = [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: -1, col: 0 },
      { row: 0, col: -1 },
    ];

    return offsets
      .map((offset) => cellByCoord.get(cellKey({ row: cell.row + offset.row, col: cell.col + offset.col })))
      .filter((cell): cell is Cell => Boolean(cell));
  }

  function reconstructPath(start: Cell, target: Cell, parent: Map<string, string>, cellByCoord: Map<string, Cell>) {
    const reversed: Cell[] = [target];
    let cursor = cellKey(target);
    const startKey = cellKey(start);

    while (cursor !== startKey) {
      const parentKey = parent.get(cursor);
      if (!parentKey) return [start];
      const parentCell = cellByCoord.get(parentKey);
      if (!parentCell) return [start];
      reversed.push(parentCell);
      cursor = parentKey;
    }

    return reversed.reverse();
  }

  function visibleLevel(cell: Cell) {
    return eatenDates.has(cell.date) ? 0 : cell.level;
  }

  function countLabel(count: number) {
    if (isChinese) return `${count} 次发布`;
    return `${count} contribution${count === 1 ? "" : "s"}`;
  }

  function showTooltip(event: MouseEvent, cell: Cell) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text: `${cell.date}: ${countLabel(cell.count)}`,
    };
  }

  function chooseRange(choice: RangeChoice) {
    selectedRange = choice;
  }

  function draw(path: Cell[]) {
    const canvas = canvasEl;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || path.length === 0) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const headIndex = Math.min(snakeHead, path.length - 1);

    for (let i = BODY_LEN; i >= 1; i -= 1) {
      const bodyIndex = headIndex - i;
      if (bodyIndex < 0) continue;
      drawSnakeCell(context, path[bodyIndex], SNAKE_BODY, 0.2 + (BODY_LEN - i + 1) / (BODY_LEN + 1) * 0.55, 2);
    }

    const head = path[headIndex];
    drawSnakeCell(context, head, SNAKE_HEAD, 1, 3);

    const x = head.col * (CELL + GAP);
    const y = head.row * (CELL + GAP);
    context.fillStyle = "#ffffff";
    context.globalAlpha = 0.95;
    context.beginPath();
    context.arc(x + CELL * 0.35, y + CELL * 0.35, 1.5, 0, Math.PI * 2);
    context.arc(x + CELL * 0.67, y + CELL * 0.35, 1.5, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  function drawSnakeCell(context: CanvasRenderingContext2D, cell: Cell, color: string, alpha: number, radius: number) {
    const x = cell.col * (CELL + GAP);
    const y = cell.row * (CELL + GAP);
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, CELL, CELL, radius);
    context.fill();
    context.globalAlpha = 1;
  }

  $effect(() => {
    selectedRange;
    snakeHead = 0;
    eatenDates = new Set();
  });

  $effect(() => {
    const path = snakePath;
    if (!canvasEl || path.length === 0) return;

    let frameId = 0;
    let lastTick = performance.now();

    function tick(timestamp: number) {
      if (timestamp - lastTick >= STEP_MS) {
        const head = path[Math.min(snakeHead, path.length - 1)];

        if (head.count > 0) {
          const nextEatenDates = new Set(eatenDates);
          nextEatenDates.add(head.date);
          eatenDates = nextEatenDates;
        }

        if (snakeHead >= path.length - 1) {
          snakeHead = 0;
          eatenDates = new Set();
        } else {
          snakeHead += 1;
        }

        lastTick = timestamp;
      }

      draw(path);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  });
</script>

<div class="hm-card" aria-label={isChinese ? "内容贡献热力图" : "Contribution heatmap"}>
  <div class="hm-topline">
    <div>
      <div class="hm-total">
        {isChinese ? `${calendar.rangeLabel} ${calendar.total} 次发布` : `${calendar.total} contributions in ${calendar.rangeLabel}`}
      </div>
      <div class="hm-range">{calendar.rangeDates}</div>
    </div>
    <div class="hm-legend" aria-hidden="true">
      <span>{isChinese ? "少" : "Less"}</span>
      {#each LIGHT as color, index}
        <span class="hm-legend-cell" style="--c-light:{color};--c-dark:{DARK[index]};"></span>
      {/each}
      <span>{isChinese ? "多" : "More"}</span>
    </div>
  </div>

  <div class="hm-body">
    <div class="hm-graph-scroll">
      <div class="hm-graph" style="width:{calendar.width + DAY_LABEL_WIDTH}px;">
        <div class="hm-months" style="margin-left:{DAY_LABEL_WIDTH}px;width:{calendar.width}px;">
          {#each calendar.monthLabels as month}
            <span class="hm-month" style="left:{month.col * (CELL + GAP)}px;">{month.label}</span>
          {/each}
        </div>

        <div class="hm-grid-line">
          <div class="hm-days" style="width:{DAY_LABEL_WIDTH}px;height:{calendar.height}px;">
            {#each dayLabels as day, row}
              <span style="top:{row * (CELL + GAP)}px;height:{CELL}px;line-height:{CELL}px;">{day}</span>
            {/each}
          </div>

          <div class="hm-stage" style="width:{calendar.width}px;height:{calendar.height}px;">
            <div class="hm-weeks" style="gap:{GAP}px;">
              {#each calendar.weeks as week}
                <div class="hm-week" style="gap:{GAP}px;">
                  {#each week as cell}
                    {#if cell}
                      {@const level = visibleLevel(cell)}
                      <div
                        class="hm-cell"
                        class:hm-today={cell.date === todayKey}
                        class:hm-eaten={eatenDates.has(cell.date) && cell.count > 0}
                        style="width:{CELL}px;height:{CELL}px;--c-light:{LIGHT[level]};--c-dark:{DARK[level]};"
                        role="img"
                        aria-label={`${cell.date}: ${countLabel(cell.count)}`}
                        title={`${cell.date}: ${countLabel(cell.count)}`}
                        onmouseenter={(event) => showTooltip(event, cell)}
                        onmouseleave={() => tooltip = null}
                      ></div>
                    {:else}
                      <span class="hm-empty" style="width:{CELL}px;height:{CELL}px;" aria-hidden="true"></span>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>

            <canvas
              bind:this={canvasEl}
              width={calendar.width}
              height={calendar.height}
              aria-hidden="true"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="hm-years" aria-label={isChinese ? "选择贡献年份" : "Select contribution year"}>
      <button
        type="button"
        class:active={selectedRange === "rolling"}
        aria-pressed={selectedRange === "rolling"}
        onclick={() => chooseRange("rolling")}
      >
        {isChinese ? "近一年" : "Last year"}
      </button>
      {#each years as year}
        <button
          type="button"
          class:active={selectedRange === year}
          aria-pressed={selectedRange === year}
          onclick={() => chooseRange(year)}
        >
          {year}
        </button>
      {/each}
    </div>
  </div>

  {#if tooltip}
    <div class="hm-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px;">{tooltip.text}</div>
  {/if}
</div>

<style>
  .hm-card {
    margin: 2rem 0;
    padding: 14px;
    border: 1px solid var(--button-border-color);
    border-radius: 6px;
    background: var(--surface-color);
    color: var(--text-color);
  }

  .hm-topline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .hm-total {
    font-size: 14px;
    line-height: 1.4;
  }

  .hm-range {
    margin-top: 2px;
    color: var(--text-color-70);
    font-family: "JetBrains Mono Variable", "Consolas", monospace;
    font-size: 11px;
  }

  .hm-body {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .hm-graph-scroll {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
  }

  .hm-graph {
    flex-shrink: 0;
  }

  .hm-months {
    position: relative;
    height: 16px;
  }

  .hm-month {
    position: absolute;
    top: 0;
    color: var(--text-color-70);
    font-size: 10px;
    line-height: 12px;
    white-space: nowrap;
  }

  .hm-grid-line {
    display: flex;
  }

  .hm-days {
    position: relative;
    flex: 0 0 auto;
  }

  .hm-days span {
    position: absolute;
    right: 6px;
    color: var(--text-color-70);
    font-size: 9px;
    text-align: right;
  }

  .hm-stage {
    position: relative;
    flex: 0 0 auto;
  }

  .hm-weeks {
    position: absolute;
    inset: 0;
    display: flex;
    pointer-events: auto;
  }

  .hm-week {
    display: flex;
    flex-direction: column;
  }

  .hm-cell,
  .hm-empty,
  .hm-legend-cell {
    display: block;
    flex: 0 0 auto;
    border-radius: 2px;
  }

  .hm-cell {
    background: var(--c-light);
    box-shadow: inset 0 0 0 1px rgba(27, 31, 36, 0.06);
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      opacity 0.16s ease,
      transform 0.16s ease;
  }

  .hm-cell:hover {
    outline: 1px solid var(--text-color);
    outline-offset: 1px;
  }

  .hm-today {
    outline: 1px solid var(--link-color);
    outline-offset: 1px;
  }

  .hm-eaten {
    opacity: 0.62;
    transform: scale(0.92);
  }

  canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .hm-legend {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--text-color-70);
    font-size: 10px;
    line-height: 1;
    white-space: nowrap;
  }

  .hm-legend-cell {
    width: 10px;
    height: 10px;
    background: var(--c-light);
    box-shadow: inset 0 0 0 1px rgba(27, 31, 36, 0.06);
  }

  .hm-years {
    display: flex;
    flex: 0 0 52px;
    flex-direction: column;
    gap: 4px;
  }

  .hm-years button {
    width: 52px;
    min-height: 26px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-color-70);
    font: inherit;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
  }

  .hm-years button:hover {
    background: var(--button-hover-color);
    color: var(--text-color);
  }

  .hm-years button.active {
    background: var(--link-color);
    color: var(--selection-text-color);
  }

  .hm-tooltip {
    position: fixed;
    z-index: 500;
    transform: translate(-50%, -100%);
    padding: 5px 8px;
    border: 1px solid var(--button-border-color);
    border-radius: 6px;
    background: var(--bg-color);
    box-shadow: 0 6px 16px var(--shadow-color);
    color: var(--text-color);
    font-size: 12px;
    line-height: 1.2;
    pointer-events: none;
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .hm-cell {
    background: var(--c-dark);
    box-shadow: inset 0 0 0 1px rgba(240, 246, 252, 0.06);
  }

  :global([data-theme="dark"]) .hm-legend-cell {
    background: var(--c-dark);
    box-shadow: inset 0 0 0 1px rgba(240, 246, 252, 0.06);
  }

  :global([data-theme="dark"]) .hm-years button.active {
    color: #ffffff;
  }

  @media (max-width: 768px) {
    .hm-card {
      margin: 1.5rem 0;
      padding: 12px;
    }

    .hm-topline {
      flex-direction: column;
      gap: 8px;
    }

    .hm-body {
      flex-direction: column;
    }

    .hm-graph-scroll {
      width: 100%;
      order: 2;
    }

    .hm-years {
      width: 100%;
      flex: none;
      flex-flow: row wrap;
      order: 1;
    }
  }
</style>
