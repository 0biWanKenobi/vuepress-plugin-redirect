// Joins path segments.  Preserves initial "/" and resolves ".." and "."
// Does not support using ".." to go above/outside the root.
// This means that join("foo", "../../bar") will not resolve to "../bar"
export default function join(...args: string[]) {
  // Split the inputs into a list of path commands.
  var parts: string[] = [];
  for (var i = 0, l = args.length; i < l; i++) {
    parts = parts.concat(args[i].split('/'));
  }
  // Interpret the path commands to get the new resolved path.
  var newParts = [];
  for (i = 0, l = parts.length; i < l; i++) {
    var part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === '.') continue;
    // Interpret ".." to pop the last segment
    if (part === '..') newParts.pop();
    // Push new path segments.
    else newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === '') newParts.unshift('');
  // Turn back into a single string path.
  return newParts.join('/') || (newParts.length ? '/' : '.');
}
