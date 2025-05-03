
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/context/EventContext';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileText, Plus, Trash2, Edit, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/utils/pdfGenerator';

const Index = () => {
  const { events, createEvent, deleteEvent, setCurrentEventId } = useEvent();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCreateEvent = async () => {
    try {
      const eventId = await createEvent("New Event", "", 100);
      navigate(`/setup`);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this event? All data will be lost.")) {
      try {
        await deleteEvent(id);
        toast({
          title: "Event deleted",
          description: "The event has been deleted successfully",
        });
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  const handleEditEvent = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentEventId(id);
    navigate('/setup');
  };

  const handleSelectEvent = (id: string) => {
    setCurrentEventId(id);
    navigate('/scoring');
  };

  const handleGeneratePDF = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const event = events.find(event => event.id === id);
    if (!event) return;
    
    try {
      await generatePDF(event);
      toast({
        title: "PDF Generated",
        description: "Results PDF has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF",
        variant: "destructive"
      });
      console.error("PDF generation error:", error);
    }
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return (
    <Layout title="Event Score Manager">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Events</h2>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" /> Create New Event
          </Button>
        </div>

        {sortedEvents.length === 0 ? (
          <Card className="border-dashed border-2 p-8">
            <CardContent className="flex flex-col items-center justify-center text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first event to get started with scoring and rankings
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="mr-2 h-4 w-4" /> Create New Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Judges</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectEvent(event.id)}
                >
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.students.length}</TableCell>
                  <TableCell>{event.judges.length}</TableCell>
                  <TableCell>
                    {event.createdAt 
                      ? formatDistanceToNow(new Date(event.createdAt), { addSuffix: true }) 
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleEditEvent(event.id, e)}
                      title="Edit Event"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => handleGeneratePDF(event.id, e)}
                      title="Generate PDF Report"
                    >
                      <File className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>About Event Score Manager</CardTitle>
              <CardDescription>A simple tool for managing event scoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Easily manage scores for your competitions, talent shows, or any event with multiple judges and participants.
                Create events, add participants and judges, score performances, and generate result reports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
