
import { Position, RequirementGroup } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to prepare requirements for database storage
 * If it's an array, keep it as is. If it's a RequirementGroup, stringify as JSON
 */
function prepareRequirementsForStorage(requirements: string[] | RequirementGroup) {
  if (Array.isArray(requirements)) {
    return requirements;
  } else {
    // For complex requirements, store as JSON
    return requirements;
  }
}

export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*');
  
  if (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
  
  return data.map(position => {
    // Process county requirements
    let countyRequirements = position.county_requirements || [];
    if (typeof countyRequirements === 'string') {
      try {
        countyRequirements = JSON.parse(countyRequirements);
      } catch {
        countyRequirements = [];
      }
    }
    
    // Process AVFRD requirements
    let avfrdRequirements = position.avfrd_requirements || [];
    if (typeof avfrdRequirements === 'string') {
      try {
        avfrdRequirements = JSON.parse(avfrdRequirements);
      } catch {
        avfrdRequirements = [];
      }
    }
    
    return {
      id: position.id,
      title: position.title,
      description: position.description || "",
      department: position.department || "",
      countyRequirements,
      avfrdRequirements,
      created_at: position.created_at,
      updated_at: position.updated_at
    };
  }) as Position[];
}

export async function createPosition(position: Position): Promise<Position> {
  // Cast the requirements to any to avoid type checking issues
  // This is safe because Supabase can store both array and JSON object
  const countyReqs: any = prepareRequirementsForStorage(position.countyRequirements);
  const avfrdReqs: any = prepareRequirementsForStorage(position.avfrdRequirements);
  
  // Fix: Use a single object instead of treating it as an array of objects
  const { data, error } = await supabase
    .from('positions')
    .insert({
      title: position.title,
      description: position.description || null,
      department: position.department || null,
      county_requirements: countyReqs,
      avfrd_requirements: avfrdReqs
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Process the returned data to match our Position type
  let countyRequirements = data.county_requirements || [];
  if (typeof countyRequirements === 'string') {
    try {
      countyRequirements = JSON.parse(countyRequirements);
    } catch {
      countyRequirements = [];
    }
  }
  
  let avfrdRequirements = data.avfrd_requirements || [];
  if (typeof avfrdRequirements === 'string') {
    try {
      avfrdRequirements = JSON.parse(avfrdRequirements);
    } catch {
      avfrdRequirements = [];
    }
  }
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    department: data.department || "",
    countyRequirements,
    avfrdRequirements,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Position;
}

export async function updatePosition(position: Position): Promise<Position> {
  // Cast the requirements to any to avoid type checking issues
  // This is safe because Supabase can store both array and JSON object
  const countyReqs: any = prepareRequirementsForStorage(position.countyRequirements);
  const avfrdReqs: any = prepareRequirementsForStorage(position.avfrdRequirements);

  const { data, error } = await supabase
    .from('positions')
    .update({
      title: position.title,
      description: position.description || null,
      department: position.department || null,
      county_requirements: countyReqs,
      avfrd_requirements: avfrdReqs
    })
    .eq('id', position.id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Process the returned data to match our Position type
  let countyRequirements = data.county_requirements || [];
  if (typeof countyRequirements === 'string') {
    try {
      countyRequirements = JSON.parse(countyRequirements);
    } catch {
      countyRequirements = [];
    }
  }
  
  let avfrdRequirements = data.avfrd_requirements || [];
  if (typeof avfrdRequirements === 'string') {
    try {
      avfrdRequirements = JSON.parse(avfrdRequirements);
    } catch {
      avfrdRequirements = [];
    }
  }
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    department: data.department || "",
    countyRequirements,
    avfrdRequirements,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Position;
}

export async function deletePosition(id: string): Promise<string> {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return id;
}
