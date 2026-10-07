/**
 * Word (.docx) renderer for the quarterly export.
 *
 * Same grid as the spreadsheet -- a row per session, a column per goal --
 * but on a landscape page where a cell grows to fit its text, so nothing is
 * cut off the way it is in a spreadsheet column. One student per page.
 *
 * All layout decisions live here; the data comes from `buildStudentReport`.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type ISectionOptions,
} from "docx";
import {
  NO_DATA,
  goalColumnLabel,
  type ReportGoal,
  type StudentReport,
} from "./export-report";

const TWIPS_PER_INCH = 1440;
const MARGIN = Math.round(0.5 * TWIPS_PER_INCH);
/**
 * US Letter, landscape. The page size is set explicitly because the default
 * is A4 -- on a US printer that leaves the table short of the right edge.
 */
const LETTER_SHORT = Math.round(8.5 * TWIPS_PER_INCH);
const LETTER_LONG = Math.round(11 * TWIPS_PER_INCH);
/** Printable width once the page is turned on its side. */
const CONTENT_WIDTH = LETTER_LONG - MARGIN * 2;

const DATE_WIDTH = 1000;
const ATTENDANCE_WIDTH = 1800;
const SETTING_WIDTH = 2000;
const NOTES_WIDTH = 2000;

const INK = "1F2937";
const MUTED = "6B7280";
const HEADER_FILL = "E8EDEC";
const NO_SHOW_FILL = "FDF6E7";
const SEPARATOR_FILL = "D9E2E0";
const GRID = "C9CFCE";

const BODY_SIZE = 18; // half-points -> 9pt
const LABEL_SIZE = 20; // 10pt

const CELL_MARGINS = { top: 60, bottom: 60, left: 90, right: 90 };

const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 2, color: GRID };
const TABLE_BORDERS = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
  insideHorizontal: TABLE_BORDER,
  insideVertical: TABLE_BORDER,
};
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

/**
 * Goal columns share whatever is left after the fixed columns. With one or
 * two goals that would leave absurdly wide columns, so each is capped and
 * any surplus goes to the notes column instead.
 */
const MAX_GOAL_WIDTH = 3200;

function columnWidths(goalCount: number, withSetting: boolean): {
  date: number;
  attendance: number;
  setting: number;
  goal: number;
  notes: number;
  all: number[];
} {
  const setting = withSetting ? SETTING_WIDTH : 0;
  const fixed = DATE_WIDTH + ATTENDANCE_WIDTH + setting + NOTES_WIDTH;
  const available = CONTENT_WIDTH - fixed;
  const goal = goalCount > 0 ? Math.min(MAX_GOAL_WIDTH, Math.floor(available / goalCount)) : 0;
  const notes = NOTES_WIDTH + (available - goal * goalCount);
  return {
    date: DATE_WIDTH,
    attendance: ATTENDANCE_WIDTH,
    setting,
    goal,
    notes,
    all: [
      DATE_WIDTH,
      ATTENDANCE_WIDTH,
      ...(withSetting ? [setting] : []),
      ...Array(goalCount).fill(goal),
      notes,
    ],
  };
}

function text(
  value: string,
  opts: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}
): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: 240 },
    children: [
      new TextRun({
        text: value,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color ?? INK,
        size: opts.size ?? BODY_SIZE,
      }),
    ],
  });
}

function cell(
  children: Paragraph[],
  opts: { width?: number; fill?: string; columnSpan?: number } = {}
): TableCell {
  return new TableCell({
    children: children.length > 0 ? children : [text("")],
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill
      ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill }
      : undefined,
    columnSpan: opts.columnSpan,
    verticalAlign: VerticalAlign.TOP,
    margins: CELL_MARGINS,
  });
}

/** Label/value pairs, two per row, in a borderless table above the grid. */
function headerTable(fields: { label: string; value: string }[]): Table {
  const rows: TableRow[] = [];
  for (let i = 0; i < fields.length; i += 2) {
    const pair = [fields[i], fields[i + 1]];
    rows.push(
      new TableRow({
        children: pair.flatMap((f, idx) => {
          const labelWidth = 1750;
          const valueWidth = Math.floor(CONTENT_WIDTH / 2) - labelWidth;
          if (!f) {
            return [
              cell([text("")], { width: labelWidth }),
              cell([text("")], { width: valueWidth }),
            ];
          }
          void idx;
          return [
            cell([text(`${f.label}:`, { bold: true, size: LABEL_SIZE, color: MUTED })], {
              width: labelWidth,
            }),
            cell([text(f.value, { size: LABEL_SIZE })], { width: valueWidth }),
          ];
        }),
      })
    );
  }
  return new Table({
    rows,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: NO_BORDERS,
    layout: TableLayoutType.FIXED,
  });
}

function goalHeaderCell(goal: ReportGoal, width: number): TableCell {
  return cell([text(goalColumnLabel(goal), { bold: true })], {
    width,
    fill: HEADER_FILL,
  });
}

function sessionTable(report: StudentReport): Table {
  const w = columnWidths(report.goals.length, report.hasPushIn);
  const totalColumns = report.goals.length + (report.hasPushIn ? 4 : 3);

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        cell([text("Date", { bold: true })], { width: w.date, fill: HEADER_FILL }),
        cell([text("Attendance", { bold: true })], {
          width: w.attendance,
          fill: HEADER_FILL,
        }),
        ...(report.hasPushIn
          ? [cell([text("Setting", { bold: true })], { width: w.setting, fill: HEADER_FILL })]
          : []),
        ...report.goals.map((g) => goalHeaderCell(g, w.goal)),
        cell([text("Notes", { bold: true })], { width: w.notes, fill: HEADER_FILL }),
      ],
    }),
  ];

  for (const row of report.rows) {
    if (row.kind === "iep-separator") {
      rows.push(
        new TableRow({
          children: [
            cell(
              [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: row.label, bold: true, size: BODY_SIZE, color: INK })],
                }),
              ],
              { columnSpan: totalColumns, fill: SEPARATOR_FILL }
            ),
          ],
        })
      );
      continue;
    }

    // A missed session is tinted so it reads as an exception at a glance,
    // the same way Session History badges it in amber.
    const fill = row.attendance.occurred ? undefined : NO_SHOW_FILL;

    const attendanceParagraphs = [text(row.attendance.label)];
    if (row.attendance.reason) {
      attendanceParagraphs.push(text(row.attendance.reason, { italics: true, color: MUTED }));
    }

    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          cell([text(row.date)], { width: w.date, fill }),
          cell(attendanceParagraphs, { width: w.attendance, fill }),
          ...(report.hasPushIn
            ? [cell([text(row.setting)], { width: w.setting, fill })]
            : []),
          ...row.goalCells.map((lines) =>
            cell(
              lines.length > 0
                ? lines.map((line) => text(line))
                : [text(NO_DATA, { color: MUTED })],
              { width: w.goal, fill }
            )
          ),
          cell([text(row.notes)], { width: w.notes, fill }),
        ],
      })
    );
  }

  return new Table({
    rows,
    columnWidths: w.all,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    layout: TableLayoutType.FIXED,
  });
}

function studentSection(report: StudentReport): ISectionOptions {
  const name = report.headerFields.find((f) => f.label === "Student")?.value || "";
  const rest = report.headerFields.filter((f) => f.label !== "Student" && f.value !== "");

  return {
    properties: {
      page: {
        // docx swaps these itself for a landscape section, so they are
        // given portrait-way-round; the page comes out 11in x 8.5in.
        size: {
          width: LETTER_SHORT,
          height: LETTER_LONG,
          orientation: PageOrientation.LANDSCAPE,
        },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      },
    },
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: name, bold: true, size: 32, color: INK })],
      }),
      headerTable(rest),
      new Paragraph({ spacing: { before: 0, after: 160 }, children: [] }),
      sessionTable(report),
    ],
  };
}

/** One landscape page per student, in the order given. */
export function buildReportDocument(reports: StudentReport[]): Document {
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: BODY_SIZE, color: INK },
        },
      },
    },
    sections: reports.map(studentSection),
  });
}
