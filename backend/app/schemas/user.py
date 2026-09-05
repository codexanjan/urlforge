from typing import Optional
from pydantic import BaseModel, Field, model_validator

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)

class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def verify_passwords(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match")
        return self
