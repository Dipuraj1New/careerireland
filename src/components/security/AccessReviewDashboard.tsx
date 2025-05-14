import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AccessReview,
  AccessReviewItem,
  AccessReviewStatus,
  AccessReviewItemStatus,
  AccessReviewDecision,
  ResourceType,
  ActionType
} from '@/types/security';

interface AccessReviewDashboardProps {
  isAdmin: boolean;
}

export default function AccessReviewDashboard({ isAdmin }: AccessReviewDashboardProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(null);
  const [reviewItems, setReviewItems] = useState<AccessReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newReview, setNewReview] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    userIds: [] as string[]
  });
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');

  // Fetch access reviews
  useEffect(() => {
    if (!isAdmin || !session) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/security/access-review?status=${activeTab.toUpperCase()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch access reviews');
        }

        const data = await response.json();
        setReviews(data.reviews);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: `Failed to load access reviews: ${err.message}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isAdmin, session, activeTab]);

  // Fetch users for creating new review
  useEffect(() => {
    if (!isAdmin || !session || !isCreateDialogOpen) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: `Failed to load users: ${err.message}`,
          variant: 'destructive'
        });
      }
    };

    fetchUsers();
  }, [isAdmin, session, isCreateDialogOpen]);

  // Fetch review items when a review is selected
  useEffect(() => {
    if (!isAdmin || !session || !selectedReview) return;

    const fetchReviewItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/security/access-review/${selectedReview.id}/items`);

        if (!response.ok) {
          throw new Error('Failed to fetch review items');
        }

        const data = await response.json();
        setReviewItems(data.items);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: `Failed to load review items: ${err.message}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviewItems();
  }, [isAdmin, session, selectedReview]);

  const handleCreateReview = async () => {
    try {
      if (!newReview.name || !selectedUsers.length) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a name and select at least one user',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/security/access-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newReview.name,
          description: newReview.description,
          startDate: newReview.startDate,
          endDate: newReview.endDate,
          userIds: selectedUsers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create access review');
      }

      const data = await response.json();

      // Reset form and close dialog
      setNewReview({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        userIds: []
      });
      setSelectedUsers([]);
      setIsCreateDialogOpen(false);

      // Refresh reviews
      setReviews(prev => [data, ...prev]);

      toast({
        title: 'Success',
        description: 'Access review created successfully',
        variant: 'default'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to create access review: ${err.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleReviewItem = async (itemId: string, decision: AccessReviewDecision, notes: string) => {
    try {
      const response = await fetch(`/api/security/access-review/${selectedReview?.id}/items/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to review item');
      }

      const data = await response.json();

      // Update review items
      setReviewItems(prev =>
        prev.map(item => item.id === itemId ? data : item)
      );

      toast({
        title: 'Success',
        description: 'Review item updated successfully',
        variant: 'default'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to review item: ${err.message}`,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: AccessReviewStatus) => {
    switch (status) {
      case AccessReviewStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case AccessReviewStatus.IN_PROGRESS:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case AccessReviewStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getItemStatusBadge = (status: AccessReviewItemStatus, decision?: AccessReviewDecision) => {
    if (status === AccessReviewItemStatus.PENDING) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }

    if (status === AccessReviewItemStatus.COMPLETED) {
      switch (decision) {
        case AccessReviewDecision.MAINTAIN:
          return <Badge variant="outline" className="bg-green-100 text-green-800">Maintain</Badge>;
        case AccessReviewDecision.REVOKE:
          return <Badge variant="outline" className="bg-red-100 text-red-800">Revoke</Badge>;
        case AccessReviewDecision.MODIFY:
          return <Badge variant="outline" className="bg-blue-100 text-blue-800">Modify</Badge>;
        default:
          return <Badge variant="outline">Unknown</Badge>;
      }
    }

    return <Badge variant="outline">Unknown</Badge>;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Review</CardTitle>
          <CardDescription>
            You do not have permission to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Access Review Dashboard</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Review</Button>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <AccessReviewList
            reviews={reviews.filter(r => r.status === AccessReviewStatus.PENDING)}
            loading={loading}
            error={error}
            onSelectReview={setSelectedReview}
            selectedReview={selectedReview}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-4">
          <AccessReviewList
            reviews={reviews.filter(r => r.status === AccessReviewStatus.IN_PROGRESS)}
            loading={loading}
            error={error}
            onSelectReview={setSelectedReview}
            selectedReview={selectedReview}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <AccessReviewList
            reviews={reviews.filter(r => r.status === AccessReviewStatus.COMPLETED)}
            loading={loading}
            error={error}
            onSelectReview={setSelectedReview}
            selectedReview={selectedReview}
          />
        </TabsContent>
      </Tabs>

      {selectedReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Review Details: {selectedReview.name}</span>
              {getStatusBadge(selectedReview.status)}
            </CardTitle>
            <CardDescription>
              {selectedReview.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p>{format(new Date(selectedReview.startDate), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p>{format(new Date(selectedReview.endDate), 'PPP')}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Users to Review</h3>
            {loading ? (
              <p>Loading review items...</p>
            ) : reviewItems.length === 0 ? (
              <p>No users to review</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.userName || item.userEmail || item.userId}
                      </TableCell>
                      <TableCell>{item.userRole}</TableCell>
                      <TableCell>
                        {getItemStatusBadge(item.status, item.decision)}
                      </TableCell>
                      <TableCell>
                        {item.status === AccessReviewItemStatus.PENDING && (
                          <ReviewItemDialog
                            item={item}
                            onReview={(decision, notes) => handleReviewItem(item.id, decision, notes)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Review Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Access Review</DialogTitle>
            <DialogDescription>
              Create a new access review to periodically validate user access rights.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newReview.name}
                onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newReview.description}
                onChange={(e) => setNewReview({...newReview, description: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newReview.startDate ? format(newReview.startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newReview.startDate}
                      onSelect={(date) => date && setNewReview({...newReview, startDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newReview.endDate ? format(newReview.endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newReview.endDate}
                      onSelect={(date) => date && setNewReview({...newReview, endDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="users" className="text-right pt-2">
                Users
              </Label>
              <div className="col-span-3">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Select users to review</p>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <label htmlFor={`user-${user.id}`} className="text-sm">
                        {user.name || user.email} ({user.role})
                      </label>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-gray-500">Loading users...</p>}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{selectedUsers.length} users selected</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview}>Create Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AccessReviewListProps {
  reviews: AccessReview[];
  loading: boolean;
  error: string | null;
  onSelectReview: (review: AccessReview) => void;
  selectedReview: AccessReview | null;
}

function AccessReviewList({
  reviews,
  loading,
  error,
  onSelectReview,
  selectedReview
}: AccessReviewListProps) {
  if (loading) {
    return <p>Loading access reviews...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (reviews.length === 0) {
    return <p>No access reviews found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map(review => (
          <TableRow
            key={review.id}
            className={selectedReview?.id === review.id ? 'bg-muted/50' : ''}
          >
            <TableCell>{review.name}</TableCell>
            <TableCell>{format(new Date(review.startDate), 'PP')}</TableCell>
            <TableCell>{format(new Date(review.endDate), 'PP')}</TableCell>
            <TableCell>
              {review.status === AccessReviewStatus.PENDING && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
              )}
              {review.status === AccessReviewStatus.IN_PROGRESS && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>
              )}
              {review.status === AccessReviewStatus.COMPLETED && (
                <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectReview(review)}
              >
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface ReviewItemDialogProps {
  item: AccessReviewItem;
  onReview: (decision: AccessReviewDecision, notes: string) => void;
}

function ReviewItemDialog({ item, onReview }: ReviewItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [decision, setDecision] = useState<AccessReviewDecision>(AccessReviewDecision.MAINTAIN);
  const [notes, setNotes] = useState('');
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user permissions when dialog opens
  useEffect(() => {
    if (isOpen && item.userId) {
      fetchUserPermissions(item.userId);
    }
  }, [isOpen, item.userId]);

  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/security/permissions?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      const data = await response.json();
      setUserPermissions(data.permissions || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to load user permissions: ${err.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    onReview(decision, notes);
    setIsOpen(false);
  };

  // Group permissions by resource type
  const permissionsByResource = userPermissions.reduce((acc: any, permission: any) => {
    const resourceType = permission.resourceType || 'unknown';
    if (!acc[resourceType]) {
      acc[resourceType] = [];
    }
    acc[resourceType].push(permission);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Review</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Review Access</DialogTitle>
          <DialogDescription>
            Review access for user: {item.userName || item.userEmail || item.userId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">User Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm">{item.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm">{item.userRole}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm">{item.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm">{item.userName || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Attribute-Based Permissions</h3>
              {loading ? (
                <p>Loading permissions...</p>
              ) : userPermissions.length === 0 ? (
                <p>No attribute-based permissions found for this user.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Type</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Conditions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(permissionsByResource).map(([resourceType, permissions]: [string, any]) => (
                        <TableRow key={resourceType}>
                          <TableCell className="font-medium">
                            {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {permissions.map((permission: any, index: number) => (
                                <Badge key={index} variant="outline" className="bg-blue-50">
                                  {permission.action}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {permissions.some((p: any) => p.conditions) ? (
                              <div className="text-xs">
                                {permissions
                                  .filter((p: any) => p.conditions)
                                  .map((p: any, i: number) => (
                                    <div key={i} className="mb-1">
                                      {Object.entries(p.conditions).map(([key, value]: [string, any]) => (
                                        <div key={key}>
                                          <span className="font-medium">{key}:</span> {value.toString()}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">No conditions</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4 mt-4">
            <Label htmlFor="decision" className="text-right">
              Decision
            </Label>
            <Select
              value={decision}
              onValueChange={(value) => setDecision(value as AccessReviewDecision)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AccessReviewDecision.MAINTAIN}>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>Maintain Access</span>
                  </div>
                </SelectItem>
                <SelectItem value={AccessReviewDecision.REVOKE}>
                  <div className="flex items-center">
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    <span>Revoke Access</span>
                  </div>
                </SelectItem>
                <SelectItem value={AccessReviewDecision.MODIFY}>
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                    <span>Modify Access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide justification for your decision"
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
