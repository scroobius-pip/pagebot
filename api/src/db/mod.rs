use crate::types::source::Source;
use crate::types::{usage::Usage, user::User};
use eyre::Result;
use heed::byteorder::BE;
use heed::types::{OwnedType, SerdeJson, Str, U64};
use std::fs;
use std::path::Path;

pub struct _DB {
    pub env: heed::Env,
    pub user_db: heed::Database<UserId, SerdeJson<User>>,
    pub usage_db: heed::Database<UsageId, SerdeJson<Usage>>,
    pub source_cache_db: heed::Database<SourceCacheId, SerdeJson<Source>>,
}

impl Default for _DB {
    fn default() -> Self {
        Self::new()
    }
}
type BEU64 = U64<BE>;

type UserId = OwnedType<BEU64>;
type UsageId = OwnedType<BEU64>;
type SourceCacheId = Str;

impl _DB {
    pub fn new() -> Self {
        let path = Path::new("database").join("db.mdb");
        fs::create_dir_all(&path).expect("Failed to create db directory");
        let env = heed::EnvOpenOptions::new()
            .map_size(40 * 1024 * 1024 * 1024) // 40 GB
            .max_dbs(7)
            .open(path)
            .expect("Failed to open db");

        let user_db = env
            .create_database(Some("user"))
            .expect("Failed to create user db");

        let usage_db = env
            .create_database(Some("usage"))
            .expect("Failed to create usage db");

        let source_cache_db = env
            .create_database(Some("source_cache"))
            .expect("Failed to create source_cache db");

        Self {
            env,
            user_db,
            usage_db,
            source_cache_db,
        }
    }

    fn create_wtxn(&self) -> Result<heed::RwTxn> {
        self.env
            .write_txn()
            .map_err(|e| eyre::eyre!("Failed to create write transaction: {:?}", e))
    }

    fn create_rtxn(&self) -> Result<heed::RoTxn> {
        self.env
            .read_txn()
            .map_err(|e| eyre::eyre!("Failed to create read transaction: {:?}", e))
    }

    pub fn user_save(&self, user: User) -> Result<User> {
        let mut wtxn = self.create_wtxn()?;
        let user_id = &BEU64::new(user.id);
        self.user_db
            .put(&mut wtxn, user_id, &user)
            .map_err(|e| eyre::eyre!("Failed to save user: {:?}", e))?;

        wtxn.commit()
            .map(|_| user)
            .map_err(|e| eyre::eyre!("Failed to commit user: {:?}", e))
    }

    pub fn user(&self, user_id: u64) -> Result<Option<User>> {
        let rtxn = self.create_rtxn()?;
        let user_id = &BEU64::new(user_id);
        let user = self
            .user_db
            .get(&rtxn, user_id)
            .map_err(|e| eyre::eyre!("Failed to get user: {:?}", e))?;

        Ok(user)
    }

    pub fn usage_save(&self, usage: Usage) -> Result<Usage> {
        let mut wtxn = self.create_wtxn()?;
        let usage_id = &BEU64::new(usage.id);
        self.usage_db
            .put(&mut wtxn, usage_id, &usage)
            .map_err(|e| eyre::eyre!("Failed to save usage: {:?}", e))?;

        wtxn.commit()
            .map(|_| usage)
            .map_err(|e| eyre::eyre!("Failed to commit usage: {:?}", e))
    }

    pub fn usage(&self, usage_id: u64) -> Result<Option<Usage>> {
        let rtxn = self.create_rtxn()?;
        let usage_id = &BEU64::new(usage_id);
        let usage = self
            .usage_db
            .get(&rtxn, usage_id)
            .map_err(|e| eyre::eyre!("Failed to get usage: {:?}", e))?;

        Ok(usage)
    }

    pub fn source_cache_save(&self, source_cache: Source) -> Result<Source> {
        let mut wtxn = self.create_wtxn()?;
        self.source_cache_db
            .put(&mut wtxn, source_cache.url.as_str().trim(), &source_cache)
            .map_err(|e| eyre::eyre!("Failed to save source_cache: {:?}", e))?;

        wtxn.commit()
            .map(|_| source_cache)
            .map_err(|e| eyre::eyre!("Failed to commit source_cache: {:?}", e))
    }

    pub fn source_cache(&self, source_cache_id: &str) -> Result<Option<Source>> {
        let rtxn = self.create_rtxn()?;
        let source_cache = self
            .source_cache_db
            .get(&rtxn, source_cache_id)
            .map_err(|e| eyre::eyre!("Failed to get source_cache: {:?}", e))?;

        Ok(source_cache)
    }
}

lazy_static! {
    pub static ref DB: _DB = _DB::new();
}
