import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Parse query param for initial user selection (e.g. from profile page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId) setSelectedUserId(userId);
  }, []);

  // Fetch conversations (list of users)
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages/conversations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    refetchInterval: 5000 // Poll for new messages/unread counts
  });

  const conversations = conversationsData?.conversations || [];

  // Filter conversations
  const filteredConversations = conversations.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch messages for selected user
  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { messages: [] };
      const res = await fetch(`/api/messages/${selectedUserId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedUserId,
    refetchInterval: 3000 // Poll for new messages in active chat
  });

  const messages = messagesData?.messages || [];

  // Mark as read when selecting a user
  useEffect(() => {
    if (selectedUserId) {
      fetch(`/api/messages/${selectedUserId}/read`, { 
        method: 'PUT',
        credentials: 'include'
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      });
    }
  }, [selectedUserId, messages.length, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedUserId) return;
      const res = await fetch(`/api/messages/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedUserId) return;
    sendMutation.mutate(messageInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const selectedUser = conversations.find((c: any) => c.id === selectedUserId);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto">
      {/* Sidebar / Conversation List */}
      <Card className={cn(
        "w-full md:w-96 flex flex-col h-full border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm",
        selectedUserId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b space-y-4 bg-background/50">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or ID..."
              className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2 gap-1">
            {filteredConversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setSelectedUserId(conv.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted/80 group relative overflow-hidden",
                  selectedUserId === conv.id ? "bg-primary/10 hover:bg-primary/15" : "bg-transparent"
                )}
              >
                {selectedUserId === conv.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarFallback className={cn(
                      "font-medium",
                      selectedUserId === conv.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {getInitials(conv.name)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" title="Online" />
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-background shadow-sm animate-in zoom-in">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={cn(
                      "font-semibold truncate text-sm",
                      selectedUserId === conv.id ? "text-primary" : "text-foreground"
                    )}>
                      {conv.name}
                    </span>
                    {conv.lastMessageTime && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {conv.employeeId && (
                      <span className="font-mono bg-muted px-1.5 rounded text-[10px]">{conv.employeeId}</span>
                    )}
                    <span className="truncate">{conv.role || conv.department}</span>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground/70"
                  )}>
                    {conv.lastMessage || <span className="italic opacity-50">Start a conversation</span>}
                  </p>
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No users found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className={cn(
        "flex-1 flex flex-col h-full overflow-hidden border shadow-sm bg-card/30 backdrop-blur-sm",
        !selectedUserId ? "hidden md:flex" : "flex"
      )}>
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-4 bg-background/80 backdrop-blur-md z-10 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden -ml-2" 
                onClick={() => setSelectedUserId(null)}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"><path d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </Button>
              <div className="relative">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary">{selectedUser ? getInitials(selectedUser.name) : '?'}</AvatarFallback>
                </Avatar>
                {selectedUser?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div>
                <h3 className="font-semibold leading-none">{selectedUser?.name || 'Loading...'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedUser?.isOnline ? (
                    <span className="text-[10px] text-green-600 font-medium">Active now</span>
                  ) : (
                    <p className="text-xs text-muted-foreground">{selectedUser?.role || selectedUser?.department || ''}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/5" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p>No messages yet.</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg: any, index: number) => {
                  const isMe = msg.senderId !== selectedUserId;
                  const showTime = index === 0 || new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;
                  
                  return (
                    <div key={msg._id} className="space-y-2">
                      {showTime && (
                        <div className="flex justify-center">
                          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex w-full animate-in slide-in-from-bottom-2 duration-300",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm relative group",
                            isMe 
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm" 
                              : "bg-card border rounded-bl-sm"
                          )}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 mt-1",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            <span className="text-[9px]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              msg.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-200" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-md border-t">
              <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-3xl border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 min-h-[44px] px-4"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!messageInput.trim() || sendMutation.isPending} 
                  size="icon"
                  className="rounded-full h-10 w-10 shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="bg-muted/30 p-8 rounded-full mb-6 animate-pulse">
              <MessageSquare className="w-16 h-16 opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Your Messages</h3>
            <p className="text-muted-foreground max-w-sm text-center">
              Select a conversation from the list to start chatting with your team members.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
