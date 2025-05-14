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

  // Check if user is an admin
  if (session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'You do not have permission to access this endpoint' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getMappings(req, res);
    case 'POST':
      return createMapping(req, res, session.user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all field mappings
async function getMappings(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get query parameters for filtering and pagination
    const { templateId, portalId, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = supabase
      .from('field_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters if provided
    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    if (portalId) {
      query = query.eq('portal_id', portalId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching field mappings:', error);
      return res.status(500).json({ error: 'Failed to fetch field mappings' });
    }

    return res.status(200).json({ mappings: data, count });
  } catch (error: any) {
    console.error('Error in getMappings:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Create a new field mapping
async function createMapping(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const mapping = req.body;

    // Validate required fields
    if (!mapping.name) {
      return res.status(400).json({ error: 'Mapping name is required' });
    }

    if (!mapping.templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    if (!mapping.portalId) {
      return res.status(400).json({ error: 'Portal ID is required' });
    }

    if (!mapping.mappings || mapping.mappings.length === 0) {
      return res.status(400).json({ error: 'At least one field mapping is required' });
    }

    // Check if template exists
    const { data: templateData, error: templateError } = await supabase
      .from('form_templates')
      .select('id')
      .eq('id', mapping.templateId)
      .single();

    if (templateError || !templateData) {
      return res.status(400).json({ error: 'Template not found' });
    }

    // Check if portal exists
    const { data: portalData, error: portalError } = await supabase
      .from('government_portals')
      .select('id')
      .eq('id', mapping.portalId)
      .single();

    if (portalError || !portalData) {
      return res.status(400).json({ error: 'Portal not found' });
    }

    // Add metadata
    const now = new Date().toISOString();
    const mappingWithMetadata = {
      name: mapping.name,
      description: mapping.description,
      template_id: mapping.templateId,
      portal_id: mapping.portalId,
      mappings: mapping.mappings,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('field_mappings')
      .insert(mappingWithMetadata)
      .select()
      .single();

    if (error) {
      console.error('Error creating field mapping:', error);
      return res.status(500).json({ error: 'Failed to create field mapping' });
    }

    return res.status(201).json({ mapping: data });
  } catch (error: any) {
    console.error('Error in createMapping:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
