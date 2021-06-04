export function xPathEscapeQuotes(path: string): string {
  let parts: string[] = [];
  let currentSubstring: string = "'";
  let currentEnclosure: string = "'";
  const switchEnclosure: { [key: string]: string } = { '"': "'", "'": '"' };

  for (var i: number = 0; i < path.length; i++) {
    const c: string = path.charAt(i);
    if (c === currentEnclosure) {
      // If the next character is the current enclosure, push the current string
      // to the list of string components, switch the current enclosure and set
      // up the next part of the string
      currentSubstring = currentSubstring.concat(currentEnclosure);
      parts.push(currentSubstring);
      currentEnclosure = switchEnclosure[currentEnclosure];
      currentSubstring = currentEnclosure + c;
    } else {
      // Otherwise continue adding to the current part
      currentSubstring = currentSubstring.concat(c);
    }
  }

  // Finish the current enclosure if we haven't already
  if (currentSubstring.charAt(currentSubstring.length - 1) !== currentEnclosure) {
    currentSubstring = currentSubstring.concat(currentEnclosure);
    parts.push(currentSubstring);
  }

  // Wrap the string parts in a concat call
  if (parts.length === 0) {
    return currentSubstring;
  } else if (parts.length === 1) {
    return parts[0];
  } else {
    let output: string = "concat(";
    for (var i: number = 0; i < parts.length; i++) {
      const part = parts[i];
      output = output.concat(part + ", ");
    }
    output = output.slice(0, output.length - 2);
    return output.concat(")");
  }
}
