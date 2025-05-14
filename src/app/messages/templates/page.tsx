'use client';

/**
 * Message Templates Page
 * 
 * Page for managing message templates.
 */
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { MessageTemplate } from '@/types/message';

/**
 * Template Form Dialog
 */
function TemplateFormDialog({
  open,
  onClose,
  template,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  template?: MessageTemplate;
  onSave: (template: any) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
      setCategory(template.category);
      setVariables(template.variables ? Object.keys(template.variables) : []);
    } else {
      setName('');
      setContent('');
      setCategory('');
      setVariables([]);
    }
  }, [template]);
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!name || !content || !category) return;
    
    setIsLoading(true);
    
    try {
      // Convert variables array to object
      const variablesObj: Record<string, string> = {};
      variables.forEach((variable) => {
        variablesObj[variable] = '';
      });
      
      await onSave({
        id: template?.id,
        name,
        content,
        category,
        variables: variablesObj,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding a variable
  const handleAddVariable = () => {
    if (!newVariable || variables.includes(newVariable)) return;
    
    setVariables([...variables, newVariable]);
    setNewVariable('');
  };
  
  // Handle removing a variable
  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {template ? 'Edit Template' : 'New Template'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
              required
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="case">Case</MenuItem>
              <MenuItem value="document">Document</MenuItem>
              <MenuItem value="payment">Payment</MenuItem>
              <MenuItem value="appointment">Appointment</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Template Content"
            multiline
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
            required
            helperText="Use {{variableName}} for variables"
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Variables
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              label="Variable Name"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              sx={{ mr: 1, flexGrow: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddVariable}
              disabled={!newVariable || variables.includes(newVariable)}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {variables.map((variable) => (
              <Chip
                key={variable}
                label={variable}
                onDelete={() => handleRemoveVariable(variable)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !name || !content || !category}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Message Templates Page
 */
export default function MessageTemplatesPage() {
  const { data: session } = useSession();
  const theme = useTheme();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<MessageTemplate | undefined>(undefined);
  
  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Filter templates when category changes
  useEffect(() => {
    if (currentCategory === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter((t) => t.category === currentCategory));
    }
  }, [templates, currentCategory]);
  
  // Fetch templates from API
  const fetchTemplates = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/messages/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save template
  const saveTemplate = async (template: any) => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      
      if (template.id) {
        // Update existing template
        response = await fetch(`/api/messages/templates/${template.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: template.name,
            content: template.content,
            category: template.category,
            variables: template.variables,
          }),
        });
      } else {
        // Create new template
        response = await fetch('/api/messages/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: template.name,
            content: template.content,
            category: template.category,
            variables: template.variables,
          }),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      // Refresh templates
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete template
  const deleteTemplate = async (id: string) => {
    if (!session?.user?.id) return;
    
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      // Refresh templates
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle category change
  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentCategory(newValue);
  };
  
  // Handle new template
  const handleNewTemplate = () => {
    setCurrentTemplate(undefined);
    setDialogOpen(true);
  };
  
  // Handle edit template
  const handleEditTemplate = (template: MessageTemplate) => {
    setCurrentTemplate(template);
    setDialogOpen(true);
  };
  
  // Get unique categories
  const categories = ['all', ...new Set(templates.map((t) => t.category))];
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Message Templates</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewTemplate}
          >
            New Template
          </Button>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}
        
        <Tabs
          value={currentCategory}
          onChange={handleCategoryChange}
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((category) => (
            <Tab
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            />
          ))}
        </Tabs>
        
        {isLoading && templates.length === 0 ? (
          <Typography>Loading templates...</Typography>
        ) : filteredTemplates.length === 0 ? (
          <Typography>No templates found.</Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Category: {template.category}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {template.content}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      onClick={() => handleEditTemplate(template)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteTemplate(template.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      <TemplateFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        template={currentTemplate}
        onSave={saveTemplate}
      />
    </Container>
  );
}
