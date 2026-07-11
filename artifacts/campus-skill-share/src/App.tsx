import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AppLayout } from "./components/layout";

// Pages
import LandingPage from "./pages/landing";
import FeedPage from "./pages/feed";
import NewPostPage from "./pages/post-new";
import PostDetailPage from "./pages/post-detail";
import ChatPage from "./pages/chat";
import ChatListPage from "./pages/chat-list";
import ProfilePage from "./pages/profile";
import AdminDashboard from "./pages/admin";
import NotFound from "./pages/not-found";
import UsersDirectoryPage from "./pages/users-directory";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/feed" component={FeedPage} />
        <Route path="/post/new" component={NewPostPage} />
        <Route path="/post/:id" component={PostDetailPage} />
        <Route path="/chats" component={ChatListPage} />
        <Route path="/chat/:userId" component={ChatPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/users" component={UsersDirectoryPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

export default App;
