function getInitials(inputString: string): string {
    const words = inputString.trim().split(' ');
    const initials = words.map(word => word[0].toUpperCase()).join('');
    return initials.split("")[0];
  }

  export default getInitials