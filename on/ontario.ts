
import * as csv from "jsr:@std/csv";

interface Detail { name: string; total: number };

type Item = {
  name: string;
  salaries_and_wages: { details?: Detail[]; total: number };
  employee_benefits: { details?: Detail[]; total: number };
  transportation_and_communication: { details?: Detail[]; total: number };
  services: { details?: Detail[]; total: number };
  supplies_and_equipment: { details?: Detail[]; total: number };
  transfer_payments: { details?: Detail[]; total: number };
  recoveries: { details?: Detail[]; total: number };
  other_transactions: { details?: Detail[]; total: number };
  total: number;
}

type Activity = Item & {
  subitems: Item[];
};

type Program = Item & {
  activities: Activity[];
};

type Ministry = Item & {
  programs: Program[];
};

export async function getOntario(filePath: string, outputPath: string = "./ontario.json") {

  const text = await Deno.readTextFile(filePath);
  const data = csv.parse(text, { skipFirstRow: true, columns: ["year", "amount", "ministry", "category", "program", "activity", "subitem", "account", "details"] });

  const ministries: Ministry[] = [];

  data.forEach((row) => {
    const amount = row.amount === "-" ? 0 : Number(row.amount.replace(/,/g, ''));

    let ministry = ministries.find((m) => m.name === row.ministry);

    if (!ministry) {
      ministry = {
        name: row.ministry.trim(),
        programs: [],
        salaries_and_wages: { total: 0 },
        employee_benefits: { total: 0 },
        transportation_and_communication: { total: 0 },
        services: { total: 0 },
        supplies_and_equipment: { total: 0 },
        transfer_payments: { total: 0 },
        recoveries: { total: 0 },
        other_transactions: { total: 0 },
        total: 0,
      };
      ministries.push(ministry);
    }

    let program = ministry.programs.find((p) => p.name === row.program);

    if (!program) {
      program = {
        name: row.program.trim(),
        activities: [],
        salaries_and_wages: { total: 0 },
        employee_benefits: { total: 0 },
        transportation_and_communication: { total: 0 },
        services: { total: 0 },
        supplies_and_equipment: { total: 0 },
        transfer_payments: { total: 0 },
        recoveries: { total: 0 },
        other_transactions: { total: 0 },
        total: 0,
      };
      ministry.programs.push(program);
    }

    let activity = program.activities.find((a) => a.name === row.activity);

    if (!activity) {
      activity = {
        name: row.activity.trim(),
        subitems: [],
        salaries_and_wages: { details: [], total: 0 },
        employee_benefits: { details: [], total: 0 },
        transportation_and_communication: { details: [], total: 0 },
        services: { details: [], total: 0 },
        supplies_and_equipment: { details: [], total: 0 },
        transfer_payments: { details: [], total: 0 },
        recoveries: { details: [], total: 0 },
        other_transactions: { details: [], total: 0 },
        total: 0,
      };
      program.activities.push(activity);
    }

    let subitem = activity.subitems.find((s) => s.name === row.subitem);

    if (row.subitem && row.subitem !== "No Value") {
      if (!subitem) {
        subitem = {
          name: row.subitem.trim(),
          salaries_and_wages: { details: [], total: 0 },
          employee_benefits: { details: [], total: 0 },
          transportation_and_communication: { details: [], total: 0 },
          services: { details: [], total: 0 },
          supplies_and_equipment: { details: [], total: 0 },
          transfer_payments: { details: [], total: 0 },
          recoveries: { details: [], total: 0 },
          other_transactions: { details: [], total: 0 },
          total: 0,
        };
        activity.subitems.push(subitem);
      }
    }

    const account = row.account.toLowerCase().replace(/ /g, "_") as keyof Item;

    const updateTotals = (item: Item | Activity | Program | Ministry) => {
      if (item && typeof item[account] === 'object' && 'total' in item[account]) {
        if (row.details && row.details !== "No Value") {
          if (item[account].details) {
            item[account].details.push({ name: row.details.trim(), total: amount });
          }
        }
        item[account].total += amount;
        item.total += amount;
      }
    };

    if (subitem) {
      updateTotals(subitem);
    }
    updateTotals(activity);
    updateTotals(program);
    updateTotals(ministry);

  })
  // Sort ministries, programs, activities, and subitems alphabetically
  ministries.forEach((ministry) => {
    ministry.programs.forEach((program) => {
      program.activities.forEach((activity) => {
        activity.subitems.sort((a, b) => a.name.localeCompare(b.name));
      });
      program.activities.sort((a, b) => a.name.localeCompare(b.name));
    });
    ministry.programs.sort((a, b) => a.name.localeCompare(b.name));
  });
  ministries.sort((a, b) => a.name.localeCompare(b.name));

  await Deno.writeTextFile(outputPath, JSON.stringify(ministries, null, 2));

}