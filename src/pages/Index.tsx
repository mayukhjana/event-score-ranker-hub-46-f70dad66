import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/context/EventContext';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileText, Plus, Trash2, Edit, File, Search, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePDF, generateJudgeScoringSheets } from '@/utils/pdfGenerator';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const Index = () => {
  const { events, createEvent, deleteEvent, setCurrentEventId } = useEvent();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;
  
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
        description: "Scoring sheets have been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the scoring sheets",
        variant: "destructive"
      });
      console.error("PDF generation error:", error);
    }
  };

  const handleGenerateScoringSheets = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const event = events.find(event => event.id === id);
    if (!event) return;
    
    try {
      generateJudgeScoringSheets(event);
      toast({
        title: "Scoring Sheets Generated",
        description: "Judge scoring sheets have been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Scoring Sheet Generation Failed",
        description: "There was an error generating the scoring sheets",
        variant: "destructive"
      });
      console.error("Scoring sheets generation error:", error);
    }
  };

  // Filter events based on search query
  const filteredEvents = searchQuery 
    ? events.filter(event => 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (event.school && event.school.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : events;

  // Sort events by creation date (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  // Pagination logic
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Create page numbers array for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  // Display page numbers with ellipsis for many pages
  const renderPaginationItems = () => {
    // Always show first page, last page, current page, and pages adjacent to current page
    const pagesToShow = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    
    // Filter out invalid pages and sort
    const validPages = [...pagesToShow]
      .filter(page => page > 0 && page <= totalPages)
      .sort((a, b) => a - b);
    
    return validPages.map((page, index, array) => {
      // Add ellipsis when there's a gap between pages
      if (index > 0 && page - array[index - 1] > 1) {
        return (
          <React.Fragment key={`ellipsis-${page}`}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem key={page}>
              <PaginationLink isActive={page === currentPage} onClick={() => paginate(page)}>
                {page}
              </PaginationLink>
            </PaginationItem>
          </React.Fragment>
        );
      }
      
      return (
        <PaginationItem key={page}>
          <PaginationLink isActive={page === currentPage} onClick={() => paginate(page)}>
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };
  
  return (
    <Layout title="Event Score Manager">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Events</h2>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" /> Create New Event
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search events..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
          />
        </div>

        {/* Event information and counts */}
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(sortedEvents.length, indexOfFirstEvent + 1)}-{Math.min(indexOfLastEvent, sortedEvents.length)} of {sortedEvents.length} event(s)
        </div>

        {/* Events list */}
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
              {currentEvents.map((event) => (
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
                      title="Generate Results PDF"
                    >
                      <File className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleGenerateScoringSheets(event.id, e)}
                      title="Generate Scoring Sheets"
                    >
                      <FileSearch className="h-4 w-4" />
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationPrevious
                onClick={() => paginate(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
              {renderPaginationItems()}
              <PaginationNext
                onClick={() => paginate(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationContent>
          </Pagination>
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
