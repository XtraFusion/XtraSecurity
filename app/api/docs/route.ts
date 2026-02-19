import { NextResponse } from 'next/server';
import openapiSpec from '../openapi.json';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(openapiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}
