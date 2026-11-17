export function FieldError({ errors, name }) {
  return errors?.[name] ? <p className="mt-1 text-sm text-destructive">{errors[name]}</p> : null;
}
