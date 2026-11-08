// Swaps in the server's copy of one row, matched on its id field
// (`eventId`, `userId`, `messageId`), leaving the rest of the list as it was
export function replaceById(list, key, item) {
  return list.map((row) => (row[key] === item[key] ? item : row));
}
