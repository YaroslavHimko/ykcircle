export function FoodChoices({ choices }) {
  if (!Array.isArray(choices) || !choices.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">Food:</span>
      {choices.map((option) => (
        <span key={option} className="rounded-full bg-secondary px-2.5 py-1">
          {option}
        </span>
      ))}
    </div>
  );
}
