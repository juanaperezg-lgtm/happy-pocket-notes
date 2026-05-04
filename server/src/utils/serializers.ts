import { JournalEntry, Transaction } from "@prisma/client";

const centsToAmount = (cents: number) => Number((cents / 100).toFixed(2));
const amountToCents = (amount: number) => Math.round(amount * 100);

const dateToIsoDay = (date: Date) => date.toISOString().slice(0, 10);
const isoDayToDate = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

export const serializeTransaction = (row: Transaction) => ({
  id: row.id,
  kind: row.kind,
  category: row.category,
  amount: centsToAmount(row.amountCents),
  date: dateToIsoDay(row.date),
  note: row.note ?? undefined,
});

export const deserializeTransaction = (input: {
  kind: "expense" | "income";
  category: string;
  amount: number;
  date: string;
  note?: string;
}) => ({
  kind: input.kind,
  category: input.category,
  amountCents: amountToCents(input.amount),
  date: isoDayToDate(input.date),
  note: input.note,
});

export const serializeJournal = (row: JournalEntry) => ({
  id: row.id,
  date: dateToIsoDay(row.date),
  text: row.text,
});

export const deserializeJournal = (input: { date: string; text: string }) => ({
  date: isoDayToDate(input.date),
  text: input.text,
});

export const amountToStorageCents = amountToCents;
export const centsToStorageAmount = centsToAmount;
