
interface EmptyStateProps {
  hasNextPositions: boolean;
}

export function EmptyState({ hasNextPositions }: EmptyStateProps) {
  return (
    <div className="text-center py-4 text-muted-foreground">
      {hasNextPositions 
        ? "Select a position to see required trainings"
        : "You have qualified for all available positions!"}
    </div>
  );
}
