from base import Base
import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import VARCHAR, DateTime

class Users(Base):
    __tablename__ = "Users"

    id: Mapped[int] = mapped_column(primary_key=True, unique=True, nullable=False)
    login_name: Mapped[str] = mapped_column(VARCHAR(30), nullable=False)
    hash_password: Mapped[str] = mapped_column(VARCHAR(150), nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(15), nullable=False)
    register_date: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.datetime.utcnow,
        nullable=False
    )