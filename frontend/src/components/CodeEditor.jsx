import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import useAuthStore from '../stores/authStore';
const CodeEditor = ({ onSubmit, isSubmitting, problem }) => {
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
  const [language, setLanguage] = useState('javascript');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [panelWidth, setPanelWidth] = useState(384); // 384px = w-96
  const [isResizing, setIsResizing] = useState(false);
  const { getAuthHeaders, API_BASE_URL } = useAuthStore();
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const languages = [
    { id: 63, name: 'JavaScript', value: 'javascript', monaco: 'javascript' },
    { id: 71, name: 'Python', value: 'python', monaco: 'python' },
    { id: 62, name: 'Java', value: 'java', monaco: 'java' },
    { id: 50, name: 'C', value: 'c', monaco: 'c' },
    { id: 54, name: 'C++', value: 'cpp', monaco: 'cpp' },
    { id: 51, name: 'C#', value: 'csharp', monaco: 'csharp' },
    { id: 60, name: 'Go', value: 'go', monaco: 'go' },
    { id: 72, name: 'Ruby', value: 'ruby', monaco: 'ruby' },
    { id: 68, name: 'PHP', value: 'php', monaco: 'php' },
    { id: 73, name: 'Rust', value: 'rust', monaco: 'rust' },
    { id: 74, name: 'TypeScript', value: 'typescript', monaco: 'typescript' }
  ];
  const getDefaultCode = (lang) => {
    const templates = {
      javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
      python: '# Write your Python code here\nprint("Hello, World!")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
      ruby: '# Write your Ruby code here\nputs "Hello, World!"',
      php: '<?php\n// Write your PHP code here\necho "Hello, World!\\n";\n?>',
      rust: 'fn main() {\n    println!("Hello, World!");\n}',
      typescript: '// Write your TypeScript code here\nconsole.log("Hello, World!");'
    };
    return templates[lang] || '// Write your code here';
  };
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(getDefaultCode(newLanguage));
  };
  const runCode = async () => {
    if (!code.trim()) {
      setError('Please write some code first');
      return;
    }
    setIsRunning(true);
    setError('');
    setOutput('');
    setRunResult(null);
    try {
      const selectedLang = languages.find(lang => lang.value === language);
      if (!selectedLang) {
        throw new Error('Language not supported');
      }
      const response = await fetch(`${API_BASE_URL}/code/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.id,
          stdin: input
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Execution failed');
      }

      if (result.stdout) {
        setOutput(result.stdout);
        setRunResult({ type: 'success', message: 'Code executed successfully' });
      } else if (result.stderr) {
        setError(result.stderr);
        setRunResult({ type: 'error', message: 'Runtime error occurred' });
      } else if (result.compile_output) {
        setError(result.compile_output);
        setRunResult({ type: 'error', message: 'Compilation error occurred' });
      } else {
        setOutput('Code executed successfully (no output)');
        setRunResult({ type: 'success', message: 'Code executed successfully' });
      }
    } catch (err) {
      setError(err.message || 'Failed to execute code');
      setRunResult({ type: 'error', message: err.message || 'Failed to execute code' });
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      setError('Please write some code first');
      return;
    }

    if (!onSubmit) {
      setError('Submit functionality not available');
      return;
    }
    await onSubmit(code, language);
  };
  const clearCode = () => {
    setCode(getDefaultCode(language));
    setInput('');
    setOutput('');
    setError('');
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    const minWidth = 200;
    const maxWidth = Math.max(containerRect.width - 400, minWidth);

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Code Editor</h2>
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running...</span>
              </>
            ) : (
              <span>Run Code</span>
            )}
          </button>
          {onSubmit && (
            <button
              onClick={submitCode}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Code</span>
              )}
            </button>
          )}
          <button
            onClick={clearCode}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Editor and I/O */}
      <div ref={containerRef} className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-2 bg-gray-800 text-sm text-gray-300 border-b border-gray-700">
            Code
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={languages.find(lang => lang.value === language)?.monaco || 'javascript'}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                smoothScrolling: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalHasArrows: false,
                  horizontalHasArrows: false,
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-2 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 cursor-col-resize transition-colors select-none"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        />

        {/* Input/Output Panel */}
        <div
          className="flex flex-col border-l border-gray-700"
          style={{ width: `${panelWidth}px` }}
        >
          {/* Run Result Status */}
          {runResult && (
            <div className={`p-3 border-b border-gray-700 ${
              runResult.type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={runResult.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {runResult.type === 'success' ? '✅' : '❌'}
                </span>
                <span className={`text-sm font-medium ${
                  runResult.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {runResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-1 flex flex-col">
            <div className="p-2 bg-gray-800 text-sm text-gray-300 border-b border-gray-700">
              Custom Input
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter custom input for testing..."
              className="flex-1 p-3 bg-gray-900 text-white border-none resize-none focus:outline-none font-mono text-sm"
            />
          </div>

          {/* Output */}
          <div className="flex-1 flex flex-col border-t border-gray-700">
            <div className="p-2 bg-gray-800 text-sm text-gray-300 border-b border-gray-700">
              Output
            </div>
            <div className="flex-1 p-3 bg-gray-900 text-white overflow-auto">
              {error && (
                <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                  {error}
                </div>
              )}
              {output && !error && (
                <div className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {output}
                </div>
              )}
              {!error && !output && (
                <div className="text-gray-500 text-sm">
                  Click "Run Code" to test with custom input
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;