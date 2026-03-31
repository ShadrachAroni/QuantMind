import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { terminalDebugger } from '../../utils/terminalDebugger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches JS errors and provides detailed terminal logs.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to terminal debugger
    console.error('🛑 [FATAL_CRASH_DETECTED]');
    console.error('--------------------------------------------------');
    console.error(`ERROR: ${error.message}`);
    console.error('STACK_TRACE:');
    console.error(error.stack);
    console.error('--------------------------------------------------');
    
    terminalDebugger.logError('CRITICAL_RENDER_FAILURE', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>🛑 [SYSTEM_CRASH_DETECTED]</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
            </View>
            <Text style={styles.hint}>Diagnostic data has been sent to the terminal.</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              <Text style={styles.buttonText}>ATTEMPT_REBOOT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A',
    padding: 24,
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    color: '#FF453A',
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    color: '#FF453A',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  hint: {
    color: '#848D97',
    fontFamily: 'Courier',
    fontSize: 10,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#05070A',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
