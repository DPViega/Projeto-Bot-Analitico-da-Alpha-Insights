-- Add UPDATE and DELETE RLS policies for messages table
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);