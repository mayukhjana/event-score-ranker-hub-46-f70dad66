
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/context/EventContext';

const Index = () => {
  const { eventData, resetEvent } = useEvent();
  const hasExistingEvent = eventData.eventName !== "";
  
  return (
    <Layout title="Welcome to Event Score Manager">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <p className="text-lg text-gray-600 max-w-2xl">
          Easily manage scores for your competitions, talent shows, or any event with multiple judges and participants.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Set up a new event</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Create a new event by configuring participants and judges. You'll be able to enter scores and view rankings.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/setup">Create New Event</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {hasExistingEvent ? (
            <Card>
              <CardHeader>
                <CardTitle>Continue Event</CardTitle>
                <CardDescription>{eventData.eventName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {eventData.students.length} Participants • {eventData.judges.length} Judges
                </p>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button asChild className="w-full" variant="secondary">
                  <Link to="/scoring">Continue to Scoring</Link>
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset this event? All data will be lost.")) {
                      resetEvent();
                    }
                  }}
                >
                  Reset Event
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Simple and efficient scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="text-sm text-gray-500 text-left list-decimal pl-4 space-y-2">
                  <li>Set up your event with participants and judges</li>
                  <li>Enter scores for each participant</li>
                  <li>View calculated rankings and results</li>
                </ol>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/setup">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
