import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, MessageSquare, TrendingUp, Users, Target, Settings, Send, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface AiQuestion {
  id: string;
  question: string;
  context?: string;
  response: string;
  confidence: number;
  relatedData: string[];
  category: string;
  askedAt: string;
}

export default function AiAssistant() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => fetch('/api/questions?limit=50').then(res => res.json()) as Promise<AiQuestion[]>
  });

  const askQuestion = useMutation({
    mutationFn: async (data: { question: string; context?: string }) => {
      const response = await apiRequest('POST', '/api/questions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setQuestion("");
      setContext("");
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'agent_status': return Users;
      case 'conflicts': return MessageSquare;
      case 'performance': return TrendingUp;
      case 'strategy': return Target;
      case 'workload': return Settings;
      default: return Brain;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'agent_status': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'conflicts': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'performance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'strategy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'workload': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const suggestedQuestions = [
    "What's the current status of all agents?",
    "Are there any active conflicts I should know about?",
    "How is the overall system performance?",
    "What strategic objectives need attention?",
    "Which agents are overloaded with work?",
    "What are the latest recommendations?",
    "How effective is our conflict resolution?",
    "What patterns do you see in agent communications?"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ask questions about your AI agents and get intelligent insights
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Brain className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Question Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask a Question
          </CardTitle>
          <CardDescription>
            Get intelligent answers about agent performance, conflicts, strategy, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Question</label>
            <Textarea
              placeholder="What would you like to know about your AI agents?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Context (Optional)</label>
            <Input
              placeholder="Any specific context or details to help with the answer"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button 
              onClick={() => askQuestion.mutate({ question, context: context || undefined })}
              disabled={!question.trim() || askQuestion.isPending}
              className="flex items-center gap-2"
            >
              {askQuestion.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {askQuestion.isPending ? 'Processing...' : 'Ask Question'}
            </Button>
            
            {askQuestion.isSuccess && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Question answered!</span>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Suggested Questions</label>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((suggested, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(suggested)}
                  className="text-xs"
                >
                  {suggested}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Question History
            </div>
            <Badge variant="secondary">{questions.length} questions</Badge>
          </CardTitle>
          <CardDescription>
            Review your previous questions and AI responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions asked yet. Start by asking something above!</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {questions.map((q) => {
                  const CategoryIcon = getCategoryIcon(q.category);
                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(q.category)}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {q.category.replace('_', ' ')}
                            </Badge>
                            <span className={`text-sm font-medium ${getConfidenceColor(q.confidence)}`}>
                              {q.confidence}% confidence
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(q.askedAt), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Question:</p>
                            <p className="text-gray-700 dark:text-gray-300">{q.question}</p>
                            {q.context && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Context: {q.context}
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">AI Response:</p>
                            <div className="text-blue-800 dark:text-blue-300 whitespace-pre-line">
                              {q.response}
                            </div>
                          </div>
                          
                          {q.relatedData && q.relatedData.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Related to {q.relatedData.length} system entities
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}