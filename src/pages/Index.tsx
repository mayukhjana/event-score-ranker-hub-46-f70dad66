
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/context/EventContext';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileText, Plus, Trash2, Edit, File, Search, FileSearch, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePDF, generateJudgeScoringSheets } from '@/utils/pdfGenerator';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  // Group events by festival/school
  const groupedEvents = useMemo(() => {
    const filtered = searchQuery 
      ? events.filter(event => 
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (event.school && event.school.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : events;

    const sorted = [...filtered].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group by school/festival name
    const grouped = sorted.reduce((acc, event) => {
      const festivalName = event.school || 'Unnamed Festival';
      if (!acc[festivalName]) {
        acc[festivalName] = [];
      }
      acc[festivalName].push(event);
      return acc;
    }, {} as Record<string, typeof events>);

    return grouped;
  }, [events, searchQuery]);

  const totalEvents = Object.values(groupedEvents).flat().length;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Get events for current page across all festivals
  const getAllEventsFlat = () => {
    return Object.values(groupedEvents).flat();
  };

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = getAllEventsFlat().slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPaginationItems = () => {
    const pagesToShow = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    
    const validPages = [...pagesToShow]
      .filter(page => page > 0 && page <= totalPages)
      .sort((a, b) => a - b);
    
    return validPages.map((page, index, array) => {
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
          <h2 className="text-2xl font-bold">Your Festivals & Events</h2>
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
            placeholder="Search festivals or events..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Event information and counts */}
        <div className="text-sm text-muted-foreground">
          Found {Object.keys(groupedEvents).length} festival(s) with {totalEvents} event(s) total
        </div>

        {/* Festivals and Events list */}
        {totalEvents === 0 ? (
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
          <div className="space-y-4">
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedEvents).map(([festivalName, festivalEvents]) => (
                <AccordionItem key={festivalName} value={festivalName} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-left">{festivalName}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {festivalEvents.length} event{festivalEvents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
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
                        {festivalEvents.map((event) => (
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
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
