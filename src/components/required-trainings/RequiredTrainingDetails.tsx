
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
    ...selectedQualification.missingCountyTrainings.map(training => ({
      ...training,
      source: 'County' as const
    })),
    ...selectedQualification.missingAVFRDTrainings
      .filter(avfrdTraining => 
        !selectedQualification.missingCountyTrainings.some(
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
          Required Trainings for {selectedQualification.positionTitle}
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete these trainings to qualify for this position
        </p>
      </div>

      <TrainingRequirementsTable requiredTrainings={requiredTrainings} />
    </div>
  );
}
