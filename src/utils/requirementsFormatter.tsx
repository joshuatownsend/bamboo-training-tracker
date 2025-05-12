
import React from 'react';
import { RequirementGroup, Training } from '@/lib/types';
import { Badge } from "@/components/ui/badge";

/**
 * Formats a requirement (training or group) as a JSX element for display
 */
export function formatRequirement(
  requirement: string | RequirementGroup, 
  trainingsMap: Record<string, Training>,
  level: number = 0
): React.ReactNode {
  // If it's a simple string (training ID)
  if (typeof requirement === 'string') {
    const training = trainingsMap[requirement];
    return (
      <div className="ml-4" key={requirement}>
        • {training?.title || requirement}
      </div>
    );
  }

  // If it's a requirement group
  const group = requirement as RequirementGroup;
  let operatorLabel = '';
  let badgeVariant: 'default' | 'secondary' | 'outline' = 'default';

  if (group.logic === 'AND') {
    operatorLabel = 'ALL of:';
    badgeVariant = 'default';
  } else if (group.logic === 'OR') {
    operatorLabel = 'ANY ONE of:';
    badgeVariant = 'secondary';
  } else if (group.logic === 'X_OF_Y') {
    operatorLabel = `${group.count || 0} of these:`;
    badgeVariant = 'outline';
  }

  return (
    <div className={`ml-${level * 4} my-2`} key={`group-${level}-${Math.random()}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant={badgeVariant}>{group.logic}</Badge>
        <span className="text-sm font-medium">{operatorLabel}</span>
      </div>
      <div className="ml-4 border-l-2 border-muted pl-2">
        {group.requirements.map((req, index) => (
          <React.Fragment key={index}>
            {formatRequirement(req, trainingsMap, level + 1)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Formats complex requirements into a human-readable format
 */
export function formatRequirements(
  requirements: string[] | RequirementGroup, 
  trainings: Training[]
): React.ReactNode {
  // Create a map of training IDs to training objects
  const trainingsMap = trainings.reduce((acc, training) => {
    acc[training.id] = training;
    return acc;
  }, {} as Record<string, Training>);

  // If it's a simple array of training IDs
  if (Array.isArray(requirements)) {
    return (
      <div>
        {requirements.map(id => {
          const training = trainingsMap[id];
          return (
            <div key={id} className="ml-4">
              • {training?.title || id}
            </div>
          );
        })}
      </div>
    );
  }

  // If it's a complex requirement structure
  return formatRequirement(requirements, trainingsMap);
}
