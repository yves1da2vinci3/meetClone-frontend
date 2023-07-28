function calculateRowsAndColumns(n : number): object {
    const sqrtN = Math.sqrt(n);
    const r = Math.ceil(sqrtN);
    const c = Math.ceil(n / r);
    return { rows: r, columns: c };
  }

 export default calculateRowsAndColumns
  