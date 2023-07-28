function calculateGridTemplateAreas(numParticipants:number):string {
    const maxColumns = 3; // Maximum number of columns
    const maxRows = 3; // Maximum number of rows
  
    const numColumns = Math.min(numParticipants, maxColumns);
    const numRows = Math.ceil(numParticipants / maxColumns);
  
    // Define the grid template areas as a 2D array
    const gridAreas = Array.from({ length: numRows }, (_, rowIndex) =>
      Array.from({ length: numColumns }, (_, colIndex) => {
        const itemIndex = rowIndex * numColumns + colIndex;
        return itemIndex < numParticipants ? `item${itemIndex + 1}` : '.';
      })
    );
  
    // Convert the 2D array to a string representation
    const gridTemplateAreas = gridAreas
      .map((rowAreas) => `'${rowAreas.join(' ')}'`)
      .join('\n');
  
    return gridTemplateAreas;
  }
  
  export default calculateGridTemplateAreas