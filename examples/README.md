# Examples

This directory contains demonstration code and example implementations for the journal-maker application.

## Structure

### `/demos`
Standalone demonstration scripts that showcase specific features or capabilities.

- `demo-ai-enhancements.ts` - Demonstrates the usage of `callChat()` and `assembleSystemPrompt()` methods

### `/api-endpoints`
Example API endpoint implementations showing best practices for using the application's services.

- `ai-chat-example.post.ts` - Example endpoint demonstrating refactored AI-powered journal rule generation

## Running Examples

### Demo Scripts

To run a demo script:

```bash
cd apps/accountflow
npx tsx ../../examples/demos/demo-ai-enhancements.ts
```

### API Endpoints

The example API endpoints are reference implementations. To use them in your application:

1. Review the code to understand the pattern
2. Adapt the implementation to your specific use case
3. Place in appropriate location within your application's API structure

## Notes

- These examples are for demonstration and learning purposes
- They are not part of the main application runtime
- Modify them as needed for your specific requirements
