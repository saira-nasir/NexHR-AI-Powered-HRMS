import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Edit3, 
  Save, 
  X, 
  Send, 
  FileText, 
  MessageSquare,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  PenTool,
  Copy,
  Download,
  Eye,
  Star,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { EmailTemplate, mockApi } from '@/data/hiringHandbookData';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<{ subject: string; body: string }>({ subject: '', body: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await mockApi.getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template.id);
    setEditedContent({ subject: template.subject, body: template.body });
  };

  const handleSave = async (templateId: string) => {
    try {
      await mockApi.updateEmailTemplate(templateId, editedContent);
      await loadTemplates();
      setEditingTemplate(null);
      setEditedContent({ subject: '', body: '' });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditedContent({ subject: '', body: '' });
  };

  const handleSendMock = async (template: EmailTemplate) => {
    try {
      await mockApi.sendEmail(template.id, 'mock-candidate-id');
      // Show success message or update UI
    } catch (error) {
      console.error('Error sending mock email:', error);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'rejection':
        return <X className="w-5 h-5 text-red-600" />;
      case 'offer':
        return <Award className="w-5 h-5 text-green-600" />;
      default:
        return <Mail className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'interview':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'rejection':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'offer':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getTemplateBadge = (type: string) => {
    switch (type) {
      case 'interview':
        return { label: 'Interview', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'rejection':
        return { label: 'Rejection', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'offer':
        return { label: 'Offer', color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return { label: 'General', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
              <p className="text-sm text-gray-600">Manage communication templates for candidate interactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <PenTool className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </div>

      {/* Template Usage Guide */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Template Usage Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Interview templates for scheduling and confirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-500" />
                  <span>Offer templates for job offers and negotiations</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span>Rejection templates for polite candidate feedback</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`border-2 transition-all duration-300 hover:shadow-lg ${getTemplateColor(template.type)}`}
          >
            <CardHeader className="border-b bg-white/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {getTemplateIcon(template.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">{template.name}</CardTitle>
                                         <div className="flex items-center gap-2 mt-1">
                       <Badge className={`${getTemplateBadge(template.type).color} border`}>
                         {getTemplateBadge(template.type).label}
                       </Badge>
                     </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                    className="hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {editingTemplate === template.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <Textarea
                      value={editedContent.subject}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, subject: e.target.value }))}
                      className="min-h-[60px] resize-none"
                      placeholder="Enter email subject..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                    <Textarea
                      value={editedContent.body}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, body: e.target.value }))}
                      className="min-h-[200px] resize-none"
                      placeholder="Enter email body..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSave(template.id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {template.body.length > 200 
                          ? `${template.body.substring(0, 200)}...` 
                          : template.body
                        }
                      </p>
                    </div>
                  </div>
                                     <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                       <Clock className="w-4 h-4" />
                       <span>Template ready to use</span>
                     </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMock(template)}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(template.body)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    <Badge className={`${getTemplateBadge(selectedTemplate.type).color} border`}>
                      {getTemplateBadge(selectedTemplate.type).label}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedTemplate(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900">{selectedTemplate.subject}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTemplate.body}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                 <div className="flex items-center gap-4 text-sm text-gray-600">
                   <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4" />
                     <span>Template available</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <TrendingUp className="w-4 h-4" />
                     <span>Ready to use</span>
                   </div>
                 </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(selectedTemplate)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Template
                  </Button>
                  <Button
                    onClick={() => handleSendMock(selectedTemplate)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Templates;
