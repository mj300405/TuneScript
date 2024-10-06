import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatbotWidget from '../../components/ChatbotWidget';
import AuthContext from '../../context/AuthContext';

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  X: () => <div data-testid="x-icon" />,
  Send: () => <div data-testid="send-icon" />,
}));

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock fetch
global.fetch = jest.fn();

const customRender = (ui: React.ReactElement, { providerProps, ...renderOptions }: any = {}) => {
  return render(
    <AuthContext.Provider value={{ 
      isAuthenticated: true, 
      user: { id: 'test-user-id', username: 'testuser' },
      login: jest.fn(),
      logout: jest.fn(),
      ...providerProps 
    }}>
      {ui}
    </AuthContext.Provider>,
    renderOptions
  );
};

describe('ChatbotWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat button when closed', () => {
    customRender(<ChatbotWidget />);
    expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
  });

  it('opens the chat widget when the button is clicked', () => {
    customRender(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('TuneScript Assistant')).toBeInTheDocument();
  });

  it('closes the chat widget when the close button is clicked', () => {
    customRender(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('TuneScript Assistant')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('x-icon'));
    expect(screen.queryByText('TuneScript Assistant')).not.toBeInTheDocument();
  });

  it('sends a message and displays the response', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve({ task_id: 'test-task-id' }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'completed', answer: 'Test response' }) });

    customRender(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTestId('send-icon'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it('displays an error message when the request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    customRender(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTestId('send-icon'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });

    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it('uses anonymous user ID when not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve({ task_id: 'test-task-id' }) });

    customRender(<ChatbotWidget />, { 
      providerProps: { isAuthenticated: false, user: null } 
    });

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTestId('send-icon'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/rag-query',
        expect.objectContaining({
          body: JSON.stringify({
            question: 'Test message',
            user_id: 'anonymous',
          }),
        })
      );
    });

    expect(mockScrollIntoView).toHaveBeenCalled();
  });
});