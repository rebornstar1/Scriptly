import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, Save, ArrowRight, Edit, MessageSquare, ChevronRight, Star, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://scriptly-eglj.onrender.com';

interface Document {
  _id: string;
  title: string;
  updatedAt: string;
}

const HomePage = () => {
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentDocuments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/documents`);
        // Get the 3 most recently updated documents
        const recent = [...response.data]
          .sort((a: Document, b: Document) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3);
        setRecentDocuments(recent);
      } catch (error) {
        console.error("Error fetching recent documents:", error);
      }
    };

    fetchRecentDocuments();
  }, []);

  const handleCreateDocument = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/documents`, {
        title: `Untitled Document - ${Math.floor(Math.random() * 900 + 100)}`,
      });
      navigate(`/documents/${response.data._id}`);
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 md:pt-28 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Collaborate
              </span>{" "}
              on documents in real-time
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Scriptly makes it easy to create, edit, and share documents with
              your team. Work together in real-time, from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button
                onClick={handleCreateDocument}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <FileText className="mr-2 h-5 w-5" />
                Create New Document
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="bg-gray-800/50 text-gray-100 backdrop-blur hover:bg-gray-700 border-gray-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Link to="/documents">
                  Browse Documents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Improved Document Mockup */}
          <div className="mt-16 flex justify-center">
            <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-gray-700/50">
              {/* Browser-style header */}
              <div className="bg-gray-800 h-10 flex items-center px-4 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto flex items-center px-4 py-1 text-xs text-gray-300 gap-2">
                  <div className="w-4 h-4 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  Untitled Document - 936
                </div>
              </div>

              {/* Document UI */}
              <div className="bg-gray-900 flex h-[420px]">
                {/* Left sidebar */}
                <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center pt-4 gap-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="w-8 h-8 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="bg-gray-800/70 border-b border-gray-700 h-12 flex items-center px-4 gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700/50">
                      <span className="text-sm text-gray-300">Normal</span>
                    </div>
                    <div className="h-5 w-px bg-gray-700"></div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700/50">
                      <span className="text-sm text-gray-300">Sans Serif</span>
                    </div>
                    <div className="h-5 w-px bg-gray-700"></div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700/50">
                      <span className="text-sm text-gray-300">Normal</span>
                    </div>
                    <div className="h-5 w-px bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                      <div className="hover:bg-gray-700/50 p-1 rounded">
                        <div className="font-bold text-gray-300">B</div>
                      </div>
                      <div className="hover:bg-gray-700/50 p-1 rounded">
                        <div className="italic text-gray-300">I</div>
                      </div>
                      <div className="hover:bg-gray-700/50 p-1 rounded">
                        <div className="underline text-gray-300">U</div>
                      </div>
                    </div>
                  </div>

                  {/* Document content */}
                  <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-3xl mx-auto">
                      <div className="h-7 bg-gray-700/30 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-5/6 mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-11/12 mb-6"></div>
                      
                      <div className="h-4 bg-gray-700/30 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-11/12 mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-5/6 mb-6"></div>
                      
                      <div className="h-4 bg-gray-700/30 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-4/5 mb-6"></div>
                      
                      <div className="h-7 bg-gray-700/30 rounded w-2/3 mb-4"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-11/12 mb-2"></div>
                    </div>
                  </div>
                  
                  {/* Status bar */}
                  <div className="h-6 bg-gray-800 border-t border-gray-700 px-4 flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Auto-saved</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>● Connected</span>
                      <span>Sanjay</span>
                    </div>
                  </div>
                </div>
                
                {/* Right sidebar */}
                <div className="w-64 bg-gray-800/50 border-l border-gray-700 hidden lg:block">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Version History</h3>
                    <div className="space-y-2">
                      <div className="bg-gray-700/30 p-2 rounded">
                        <div className="h-2 bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                      </div>
                      <div className="bg-gray-700/30 p-2 rounded">
                        <div className="h-2 bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none"></div>
              
              {/* Glow effects */}
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-56 transform">
          <div className="w-96 h-96 rounded-full bg-blue-900/20 opacity-30 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-24 -translate-x-20 transform">
          <div className="w-72 h-72 rounded-full bg-purple-900/20 opacity-30 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/4 w-2/3 h-2/3 opacity-20"></div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          Everything you need for seamless collaboration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Feature 1 */}
          <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/20">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-xl text-white">Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Work together with your team in real-time. See changes as they happen without refreshing the page.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-900/20">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Edit className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-xl text-white">Rich Text Editing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Format your documents with rich text features. Add headings, lists, images, and more.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-teal-900/20">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-900/30 rounded-lg flex items-center justify-center mb-4">
                <Save className="h-6 w-6 text-teal-400" />
              </div>
              <CardTitle className="text-xl text-white">Auto-Saving</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Never lose your work again. Scriptly automatically saves your documents as you type.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Documents Section */}
      {recentDocuments.length > 0 && (
        <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <Star className="h-5 w-5 mr-2 text-blue-400" />
              Recent Documents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentDocuments.map((doc) => (
                <Card
                  key={doc._id}
                  className="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gray-800/80 backdrop-blur border-gray-700 hover:border-blue-700/50"
                  onClick={() => navigate(`/documents/${doc._id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-700/80 flex items-center justify-center group-hover:bg-blue-900/30 transition-colors">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-base font-medium text-gray-100 truncate group-hover:text-blue-300 transition-colors">
                        {doc.title || "Untitled Document"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm text-gray-400">
                      Last edited: {formatDate(doc.updatedAt)}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/documents"
                className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center group"
              >
                View all documents
                <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-blue-900/30 to-purple-900/30 text-white relative overflow-hidden">
        {/* Decoration blurs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full blur-3xl opacity-20"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams who use Scriptly to collaborate on documents.
          </p>
          <Button
            onClick={handleCreateDocument}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg shadow-blue-900/30 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-6"
          >
            <FileText className="mr-2 h-5 w-5" />
            Create Your First Document
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;