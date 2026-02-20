from transformers import T5Tokenizer, T5ForConditionalGeneration
from torch.utils.data import Dataset, DataLoader
import json
import torch

MODEL_NAME = "t5-small"

class BibleDataset(Dataset):
    def __init__(self, path):
        self.data = [json.loads(l) for l in open(path)]
        self.tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data[idx]
        input_text = row["text"]
        target = f'{row["book"]}|{row["chapter"]}|{row["verse"] or ""}'

        inputs = self.tokenizer(input_text, return_tensors="pt", padding="max_length", truncation=True, max_length=128)
        labels = self.tokenizer(target, return_tensors="pt", padding="max_length", truncation=True, max_length=64).input_ids

        return {
            "input_ids": inputs.input_ids.squeeze(),
            "attention_mask": inputs.attention_mask.squeeze(),
            "labels": labels.squeeze()
        }

def train():
    print("Loading dataset...")
    dataset = BibleDataset("data/bible_resolver.jsonl")
    loader = DataLoader(dataset, batch_size=8, shuffle=True)

    print("Loading model...")
    model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)

    # Use GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    model.to(device)

    model.train()
    for epoch in range(3):
        total_loss = 0
        for i, batch in enumerate(loader):
            batch = {k: v.to(device) for k, v in batch.items()}
            
            optimizer.zero_grad()
            output = model(**batch)
            loss = output.loss
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
            if i % 50 == 0:
                print(f"  Batch {i}, Loss: {loss.item():.4f}")
        
        print(f"Epoch {epoch + 1} average loss: {total_loss / len(loader):.4f}")

    print("Saving model...")
    model.save_pretrained("model")
    dataset.tokenizer.save_pretrained("model")
    print("Done!")

if __name__ == "__main__":
    train()
