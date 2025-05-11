
import { Position } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*');
  
  if (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
  
  return data.map(position => ({
    id: position.id,
    title: position.title,
    description: position.description || "",
    department: position.department || "",
    countyRequirements: position.county_requirements || [],
    avfrdRequirements: position.avfrd_requirements || [],
    created_at: position.created_at,
    updated_at: position.updated_at
  })) as Position[];
}

export async function createPosition(position: Position): Promise<Position> {
  const { data, error } = await supabase
    .from('positions')
    .insert({
      title: position.title,
      description: position.description || null,
      department: position.department || null,
      county_requirements: position.countyRequirements,
      avfrd_requirements: position.avfrdRequirements
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    department: data.department || "",
    countyRequirements: data.county_requirements || [],
    avfrdRequirements: data.avfrd_requirements || [],
    created_at: data.created_at,
    updated_at: data.updated_at
  } as Position;
}

export async function updatePosition(position: Position): Promise<Position> {
  const { data, error } = await supabase
    .from('positions')
    .update({
      title: position.title,
      description: position.description || null,
      department: position.department || null,
      county_requirements: position.countyRequirements,
      avfrd_requirements: position.avfrdRequirements
    })
    .eq('id', position.id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    department: data.department || "",
    countyRequirements: data.county_requirements || [],
    avfrdRequirements: data.avfrd_requirements || [],
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
