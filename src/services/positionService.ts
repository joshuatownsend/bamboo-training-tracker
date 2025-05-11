
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
    ...position,
    countyRequirements: position.county_requirements || [],
    avfrdRequirements: position.avfrd_requirements || []
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
  return data as Position;
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
  return data as Position;
}

export async function deletePosition(id: string): Promise<string> {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return id;
}
