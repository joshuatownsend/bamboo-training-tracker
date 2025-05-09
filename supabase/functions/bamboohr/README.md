
# BambooHR Edge Function

This Edge Function acts as a secure proxy between your front-end application and the BambooHR API.

## Setup

1. Deploy this Edge Function to your Supabase project:

```bash
supabase functions deploy bamboohr --project-ref your-project-ref
```

2. Set the required secrets in your Supabase project:

```bash
supabase secrets set BAMBOOHR_SUBDOMAIN=your-company-subdomain --project-ref your-project-ref
supabase secrets set BAMBOOHR_API_KEY=your-bamboohr-api-key --project-ref your-project-ref
```

3. Make sure your front-end application has the correct URL for the Edge Function:

```
VITE_SUPABASE_FUNCTIONS_URL=https://your-project-ref.supabase.co/functions/v1
```

## Usage

The Edge Function forwards requests to the BambooHR API. For example:

- `GET /bamboohr/employees/directory` will fetch the employee directory
- `GET /bamboohr/employees/123` will fetch details for employee with ID 123

## Security

This Edge Function keeps your BambooHR API key secure on the server side, avoiding exposure in the front-end application.

## Troubleshooting

1. Check if the Edge Function is deployed:
   ```bash
   supabase functions list
   ```

2. Verify secrets are set:
   ```bash
   supabase secrets list
   ```

3. Test the Edge Function:
   ```bash
   curl -X GET "https://your-project-ref.supabase.co/functions/v1/bamboohr/meta/fields" \
     -H "Authorization: Bearer your-anon-key"
   ```

For more help, check the [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions).
