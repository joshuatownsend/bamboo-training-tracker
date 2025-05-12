
import { QualificationStatus } from "@/lib/types";
import { TrainingRequirementsTable } from "./TrainingRequirementsTable";

interface RequiredTrainingDetailsProps {
  selectedQualification: QualificationStatus | null;
}

export function RequiredTrainingDetails({ selectedQualification }: RequiredTrainingDetailsProps) {
  if (!selectedQualification) {
    return null;
  }

  // Combine missing trainings from both county and AVFRD with source information
  const requiredTrainings = [
    ...selectedQualification.missing_county_trainings.map(training => ({
      ...training,
      source: 'County' as const
    })),
    ...selectedQualification.missing_avfrd_trainings
      .filter(avfrdTraining => 
        !selectedQualification.missing_county_trainings.some(
          countyTraining => countyTraining.id === avfrdTraining.id
        )
      )
      .map(training => ({
        ...training,
        source: 'AVFRD' as const
      }))
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">
          Required Trainings for {selectedQualification.position_title}
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete these trainings to qualify for this position
        </p>
      </div>

      <TrainingRequirementsTable requiredTrainings={requiredTrainings} />
    </div>
  );
}
