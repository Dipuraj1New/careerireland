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
      return getFormTemplates(req, res);
    case 'POST':
      return createFormTemplate(req, res, session.user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all form templates
async function getFormTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get query parameters for filtering and pagination
    const { status, limit = 50, offset = 0, search } = req.query;

    // Build query
    let query = supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching form templates:', error);
      return res.status(500).json({ error: 'Failed to fetch form templates' });
    }

    return res.status(200).json({ templates: data, count });
  } catch (error: any) {
    console.error('Error in getFormTemplates:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Create a new form template
async function createFormTemplate(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const template = req.body;

    // Validate required fields
    if (!template.name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // Check if any section has fields
    const hasFields = template.sections && template.sections.some((section: any) => section.fields && section.fields.length > 0);
    if (!hasFields) {
      return res.status(400).json({ error: 'Template must have at least one field' });
    }

    // Add metadata
    const now = new Date().toISOString();
    const templateWithMetadata = {
      ...template,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('form_templates')
      .insert(templateWithMetadata)
      .select()
      .single();

    if (error) {
      console.error('Error creating form template:', error);
      return res.status(500).json({ error: 'Failed to create form template' });
    }

    return res.status(201).json({ template: data });
  } catch (error: any) {
    console.error('Error in createFormTemplate:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
