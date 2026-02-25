-- Allow all authenticated users to read profiles (needed for chat/brotherhood name display)
CREATE POLICY "Authenticated users read all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
