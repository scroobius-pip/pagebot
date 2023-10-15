use std::{
    fs::File,
    io::{Read, Write},
    sync::atomic::{AtomicU32, AtomicU64},
};

pub static USER_COUNT: AtomicU32 = AtomicU32::new(0);
pub static MESSAGE_COUNT: AtomicU64 = AtomicU64::new(0);
pub static PAGE_COUNT: AtomicU64 = AtomicU64::new(0);

pub fn read_stats() {
    
    let mut file = File::open("stats.txt").unwrap_or_else(|_| {
        let mut file = File::create("stats.txt").expect("Failed to create stats.txt");
        file.write_all("0 0 0".as_bytes())
            .expect("Failed to write to stats.txt");
        File::open("stats.txt").expect("Failed to open stats.txt")
    });

    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();
    if data.is_empty() {
        log::warn!("stats.txt is empty, setting all stats to 0");
        data = "0 0 0".to_string();
    }
    let mut data = data.split_whitespace();
    let user_count = data.next().unwrap().parse::<u32>().unwrap();
    let message_count = data.next().unwrap().parse::<u64>().unwrap();
    let page_count = data.next().unwrap().parse::<u64>().unwrap();

    USER_COUNT.store(user_count, std::sync::atomic::Ordering::Relaxed);
    MESSAGE_COUNT.store(message_count, std::sync::atomic::Ordering::Relaxed);
    PAGE_COUNT.store(page_count, std::sync::atomic::Ordering::Relaxed);
}

pub fn write_stats() {
    let mut file = File::create("stats.txt").expect("Failed to create stats.txt");
    file.write_all(
        format!(
            "{} {} {}",
            USER_COUNT.load(std::sync::atomic::Ordering::Relaxed),
            MESSAGE_COUNT.load(std::sync::atomic::Ordering::Relaxed),
            PAGE_COUNT.load(std::sync::atomic::Ordering::Relaxed)
        )
        .as_bytes(),
    )
    .expect("Failed to write to stats.txt");
}
