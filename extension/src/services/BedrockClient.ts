/**
 * AWS Bedrock Client - Communicates with AWS Bedrock to generate creative corrupted content
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
  InvokeModelCommandOutput
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv, fromIni } from '@aws-sdk/credential-providers';

export interface BedrockConfig {
  region: string;
  modelId?: string;
}

export interface BedrockResponse {
  content: string;
  stopReason: string;
}

export class BedrockClient {
  private client: BedrockRuntimeClient | null = null;
  private config: BedrockConfig;
  private readonly DEFAULT_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';
  private readonly MAX_TOKENS = 4000;

  constructor(config: BedrockConfig) {
    this.config = {
      ...config,
      modelId: config.modelId || this.DEFAULT_MODEL
    };
  }

  /**
   * Initialize Bedrock client with credentials
   */
  async initialize(): Promise<void> {
    try {
      // Try environment variables first, then AWS config file
      const credentials = fromEnv() || fromIni();
      
      this.client = new BedrockRuntimeClient({
        region: this.config.region,
        credentials
      });
      
      console.log('✅ Bedrock client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Bedrock client:', error);
      throw error;
    }
  }

  /**
   * Check if Bedrock is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      // Try a simple invocation to test connectivity
      await this.invokeModel('Test', 10);
      return true;
    } catch (error) {
      console.warn('⚠️ Bedrock not available:', error);
      return false;
    }
  }

  /**
   * Invoke Bedrock model with a prompt
   */
  async invokeModel(prompt: string, maxTokens: number = this.MAX_TOKENS): Promise<BedrockResponse> {
    if (!this.client) {
      throw new Error('Bedrock client not initialized. Call initialize() first.');
    }

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const input: InvokeModelCommandInput = {
      modelId: this.config.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    };

    try {
      const command = new InvokeModelCommand(input);
      const response: InvokeModelCommandOutput = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        content: responseBody.content[0].text,
        stopReason: responseBody.stop_reason
      };
    } catch (error) {
      console.error('❌ Bedrock invocation failed:', error);
      throw error;
    }
  }

  /**
   * Corrupt steering content using AI
   */
  async corruptSteeringContent(originalContent: string): Promise<string> {
    const prompt = `You are a mischievous AI tasked with corrupting coding best practices into terrible advice.

Transform the following good coding advice into hilariously bad advice while keeping the same markdown structure:

<good_advice>
${originalContent}
</good_advice>

Rules for corruption:
1. Replace "const" with "var"
2. Replace "descriptive variable names" with "single letter variables"
3. Replace "write tests" with "skip tests, production is your QA"
4. Replace "add comments" with "comments are for the weak"
5. Add absurd anti-patterns like "copy-paste is a design pattern"
6. Keep it funny and obviously satirical
7. Maintain markdown formatting

Return ONLY the corrupted markdown content, no explanations.`;

    const response = await this.invokeModel(prompt);
    return response.content;
  }

  /**
   * Corrupt validation rules using AI
   */
  async corruptValidationRules(originalRules: string): Promise<string> {
    const prompt = `You are corrupting code validation rules to be absurd and contradictory.

Transform these validation rules into funny, absurd rules that flag good code as errors:

<rules>
${originalRules}
</rules>

Rules for corruption:
1. Invert logic (flag good practices as errors)
2. Add contradictory rules
3. Make error messages funny
4. Flag things like "function names too descriptive", "code too readable"
5. Return valid JSON format

Return ONLY the corrupted JSON, no explanations.`;

    const response = await this.invokeModel(prompt);
    return response.content;
  }

  /**
   * Generate funny pack name using AI
   */
  async generateFunnyPackName(originalName: string): Promise<string> {
    const prompt = `Transform this pack name into a funny anti-pattern version:

Original: "${originalName}"

Make it humorous and obviously satirical. Add an emoji. Examples:
- "React Best Practices" → "React Anti-Patterns Masterclass 🎭"
- "TypeScript Guidelines" → "TypeScript Chaos Generator 🌪️"

Return ONLY the new name, nothing else.`;

    const response = await this.invokeModel(prompt, 100);
    return response.content.trim();
  }
}
