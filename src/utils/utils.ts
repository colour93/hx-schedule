export const delay = (ms: number) => new Promise<void>(async (resolve) => {
  setTimeout(() => resolve(), ms);
})