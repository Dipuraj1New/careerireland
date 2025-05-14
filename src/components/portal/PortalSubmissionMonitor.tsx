/**
 * Portal Submission Monitor Component
 * Displays the status of portal submissions and allows for manual retry
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Button, 
  Heading, 
  Flex, 
  Text, 
  useToast, 
  Spinner,
  Link,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  WarningIcon, 
  RepeatIcon, 
  TimeIcon, 
  InfoIcon,
  ViewIcon
} from '@chakra-ui/icons';
import { format } from 'date-fns';
import { 
  PortalSubmission, 
  PortalSubmissionStatus, 
  GovernmentPortalType 
} from '../../types/portal';
import { useAuth } from '../../hooks/useAuth';
import { getPortalSubmissions, retryPortalSubmission } from '../../services/api/portalApi';

// Status badge colors
const statusColors = {
  [PortalSubmissionStatus.PENDING]: 'gray',
  [PortalSubmissionStatus.IN_PROGRESS]: 'blue',
  [PortalSubmissionStatus.SUBMITTED]: 'teal',
  [PortalSubmissionStatus.FAILED]: 'red',
  [PortalSubmissionStatus.RETRYING]: 'orange',
  [PortalSubmissionStatus.RETRY_SCHEDULED]: 'yellow',
  [PortalSubmissionStatus.COMPLETED]: 'green',
};

// Portal type display names
const portalTypeNames = {
  [GovernmentPortalType.IRISH_IMMIGRATION]: 'Irish Immigration',
  [GovernmentPortalType.IRISH_VISA]: 'Irish Visa',
  [GovernmentPortalType.GNIB]: 'GNIB',
  [GovernmentPortalType.EMPLOYMENT_PERMIT]: 'Employment Permit',
};

// Status icons
const StatusIcon = ({ status }: { status: PortalSubmissionStatus }) => {
  switch (status) {
    case PortalSubmissionStatus.COMPLETED:
      return <CheckCircleIcon color="green.500" />;
    case PortalSubmissionStatus.FAILED:
      return <WarningIcon color="red.500" />;
    case PortalSubmissionStatus.RETRYING:
      return <RepeatIcon color="orange.500" />;
    case PortalSubmissionStatus.RETRY_SCHEDULED:
      return <TimeIcon color="yellow.500" />;
    case PortalSubmissionStatus.IN_PROGRESS:
      return <Spinner size="sm" color="blue.500" />;
    default:
      return <InfoIcon color="gray.500" />;
  }
};

interface PortalSubmissionMonitorProps {
  caseId?: string; // Optional case ID to filter submissions
}

const PortalSubmissionMonitor: React.FC<PortalSubmissionMonitorProps> = ({ caseId }) => {
  const [submissions, setSubmissions] = useState<PortalSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const toast = useToast();

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getPortalSubmissions({ caseId });
      setSubmissions(data);
    } catch (error) {
      toast({
        title: 'Error fetching submissions',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
    
    // Set up polling for updates every 30 seconds
    const interval = setInterval(fetchSubmissions, 30000);
    
    return () => clearInterval(interval);
  }, [caseId]);

  // Handle manual retry
  const handleRetry = async (submissionId: string) => {
    try {
      setRetrying(prev => ({ ...prev, [submissionId]: true }));
      
      await retryPortalSubmission(submissionId);
      
      toast({
        title: 'Retry initiated',
        description: 'The submission will be retried shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh submissions
      await fetchSubmissions();
    } catch (error) {
      toast({
        title: 'Error retrying submission',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRetrying(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  // Determine if retry is allowed
  const canRetry = (submission: PortalSubmission) => {
    return (
      submission.status === PortalSubmissionStatus.FAILED &&
      submission.retryCount < 3
    );
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" shadow="md">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Portal Submissions</Heading>
        <Button 
          leftIcon={<RepeatIcon />} 
          colorScheme="blue" 
          size="sm" 
          onClick={fetchSubmissions}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>
      
      {loading && submissions.length === 0 ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : submissions.length === 0 ? (
        <Text textAlign="center" py={10} color="gray.500">
          No portal submissions found.
        </Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Status</Th>
              <Th>Portal</Th>
              <Th>Submitted</Th>
              <Th>Last Attempt</Th>
              <Th>Next Retry</Th>
              <Th>Attempts</Th>
              <Th>Confirmation</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submissions.map((submission) => (
              <Tr key={submission.id}>
                <Td>
                  <Flex align="center">
                    <StatusIcon status={submission.status} />
                    <Badge ml={2} colorScheme={statusColors[submission.status]}>
                      {submission.status}
                    </Badge>
                  </Flex>
                </Td>
                <Td>{portalTypeNames[submission.portalType]}</Td>
                <Td>{formatDate(submission.createdAt)}</Td>
                <Td>{formatDate(submission.lastAttemptAt)}</Td>
                <Td>{formatDate(submission.nextRetryAt)}</Td>
                <Td>{submission.retryCount} / 3</Td>
                <Td>
                  {submission.confirmationNumber ? (
                    <Tooltip label="View confirmation receipt">
                      <Link href={submission.confirmationReceiptUrl} isExternal>
                        {submission.confirmationNumber} <ViewIcon ml={1} />
                      </Link>
                    </Tooltip>
                  ) : (
                    'N/A'
                  )}
                </Td>
                <Td>
                  <Button
                    size="xs"
                    colorScheme="orange"
                    leftIcon={<RepeatIcon />}
                    isDisabled={!canRetry(submission)}
                    isLoading={retrying[submission.id]}
                    onClick={() => handleRetry(submission.id)}
                  >
                    Retry
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      
      {submission.errorMessage && (
        <Box mt={4} p={3} borderWidth="1px" borderRadius="md" bg="red.50">
          <Heading size="sm" color="red.500" mb={2}>
            Error Message
          </Heading>
          <Text fontSize="sm" fontFamily="monospace">
            {submission.errorMessage}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PortalSubmissionMonitor;
