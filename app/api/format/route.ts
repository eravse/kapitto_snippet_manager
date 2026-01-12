import { NextRequest, NextResponse } from 'next/server';
import prettier from 'prettier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, parser } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const formatted = await prettier.format(code, {
      parser: parser || 'babel',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
    });

    return NextResponse.json({ formatted });
  } catch (error: any) {
    console.error('Format error:', error);
    return NextResponse.json({ 
      error: 'Failed to format code',
      message: error.message 
    }, { status: 500 });
  }
}
