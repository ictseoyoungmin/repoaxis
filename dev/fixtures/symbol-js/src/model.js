export class Greeter extends BaseGreeter {
  constructor(prefix = "hi") { this.prefix = prefix; }
  greet(name) { return name.trim(); }
  static from(value) { return new Greeter(value); }
  get label() { return this.prefix; }
  set label(value) { this.prefix = value; }
  formatter = (value) => value.trim();
}

export const normalize = (value = "") => value.trim();

export async function load(input) {
  function decode(raw) { return raw; }
  return decode(input);
}

export default function (value) {
  return normalize(value);
}
