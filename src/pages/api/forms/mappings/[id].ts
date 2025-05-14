import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/types/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'You must be signed in to access this endpoint' });
  }

  // Get mapping ID from the request
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid mapping ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getMapping(req, res, id);
    case 'PUT':
      // Check if user is an admin for PUT
      if (session.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'You do not have permission to update mappings' });
      }
      return updateMapping(req, res, id, session.user.id);
    case 'DELETE':
      // Check if user is an admin for DELETE
      if (session.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'You do not have permission to delete mappings' });
      }
      return deleteMapping(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get a specific field mapping
async function getMapping(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { data, error } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Mapping not found' });
      }
      console.error('Error fetching field mapping:', error);
      return res.status(500).json({ error: 'Failed to fetch field mapping' });
    }

    return res.status(200).json({ mapping: data });
  } catch (error: any) {
    console.error('Error in getMapping:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Update a field mapping
async function updateMapping(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    const mapping = req.body;

    // Validate required fields
    if (!mapping.name) {
      return res.status(400).json({ error: 'Mapping name is required' });
    }

    if (!mapping.mappings || mapping.mappings.length === 0) {
      return res.status(400).json({ error: 'At least one field mapping is required' });
    }

    // Get the existing mapping to check if template_id or portal_id is being changed
    const { data: existingMapping, error: fetchError } = await supabase
      .from('field_mappings')
      .select('template_id, portal_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing mapping:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch existing mapping' });
    }

    // Prevent changing template_id or portal_id
    if (mapping.templateId && mapping.templateId !== existingMapping.template_id) {
      return res.status(400).json({ error: 'Template ID cannot be changed' });
    }

    if (mapping.portalId && mapping.portalId !== existingMapping.portal_id) {
      return res.status(400).json({ error: 'Portal ID cannot be changed' });
    }

    // Add metadata
    const mappingWithMetadata = {
      name: mapping.name,
      description: mapping.description,
      mappings: mapping.mappings,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    // Update in database
    const { data, error } = await supabase
      .from('field_mappings')
      .update(mappingWithMetadata)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating field mapping:', error);
      return res.status(500).json({ error: 'Failed to update field mapping' });
    }

    return res.status(200).json({ mapping: data });
  } catch (error: any) {
    console.error('Error in updateMapping:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Delete a field mapping
async function deleteMapping(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Delete from database
    const { error } = await supabase
      .from('field_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting field mapping:', error);
      return res.status(500).json({ error: 'Failed to delete field mapping' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in deleteMapping:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
