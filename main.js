  const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const moment = require('moment');

const token = "6321646297:AAF7Fj0A3HCCJsCfp2OlsKfNkHsF5ALUKVI";
const supabaseUrl = 'https://sqgifjezpzxplyvrrtev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ2lmamV6cHp4cGx5dnJydGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMzNDc2NzQsImV4cCI6MjAyODkyMzY3NH0.2yYEUffqta76luZ5mUF0pwgWNx3iEonvmxxr1KJge68';
const options = { polling: true };

const bot = new TelegramBot(token, options);
const supabase = createClient(supabaseUrl, supabaseKey);
// Function untuk menangani perintah /start
// Set commands
const commands = [
  { command: 'start', description: 'Greets the user' },
  { command: 'listitem', description: 'Displays available item and their prices' },
  { command: 'pembayaran', description: 'Via Dana' },
  { command: 'additem', description: 'Add a new item (admin only)' }
];

// Handler untuk perintah /start
bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Pesan sambutan saat pengguna menekan perintah /start
  const welcomeMessage = "Halo! Saya adalah bot Dakzy4uBot yang siap membantu Anda. Berikut adalah daftar perintah yang tersedia:\n";
  
  // Mendapatkan daftar perintah dari array commands
  const availableCommands = commands.map(command => `/${command.command} - ${command.description}`).join("\n");

  // Kirim pesan sambutan beserta daftar perintah
  bot.sendMessage(chatId, `${welcomeMessage}${availableCommands}`);
});

// Tabel format zepeto
const zepetoFormatTable = `
Format Zepeto:

SALIN DI BAWAH INI DENGAN BENAR

  ID ZPT: [Masukkan ID ZPT Anda di sini]
  Nama Sword: [Nama sword yang anda order]
`;


let waitingForPaymentDetails = {};

// Handler untuk command /pembayaran
let userStates = {}; // Inisialisasi userStates

// Handler untuk command /pembayaran
bot.onText(/^\/pembayaran$/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Simpan status pengguna sebagai "waitingPayment"
  userStates[userId] = "waitingPayment";

  // Prompt the user to continue with the payment
  bot.sendMessage(chatId, "Silahkan lanjutkan pembayaran ke @Dakzy4u.");

  // Prompt the user to send the payment details
  const promptMessage = `
Silahkan balas pesan ini setelah melakukan pembayaran dan balas pesan ini dengan format: ${zepetoFormatTable}`;
  bot.sendMessage(chatId, promptMessage);
});

// Handler untuk menangani pesan dari pengguna yang sedang menunggu detail pembayaran
// Handler untuk pesan dari pengguna yang sedang menunggu detail pembayaran
bot.on('message', async (msg) => {
  const userId = msg.from.id;

  // Check if the user is waiting for payment details
  if (userStates[userId] === "waitingPayment") {
    const text = msg.text;

    // Implement logic to handle payment details (e.g., validate format, extract ID ZPT and sword name)
    // ...

    // Example logic (replace with your actual validation and processing):
    if (text.startsWith('Format Zepeto:')) {
      const lines = text.split('\n');
      if (lines.length >= 4) {
        const idZptLine = lines.find(line => line.startsWith('ID ZPT:'));
        const swordNameLine = lines.find(line => line.startsWith('Nama Sword:'));
        if (idZptLine && swordNameLine) {
          const idZpt = idZptLine.split(':')[1].trim();
          const swordName = swordNameLine.split(':')[1].trim();

          // Process extracted ID ZPT and sword name (e.g., confirm payment, update order status)
          // ...

          bot.sendMessage(msg.chat.id, 'Terima kasih telah mengirimkan detail pembayaran. Kami akan segera memproses pesanan Anda.');
          userStates[userId] = null; // Clear user state after successful processing
        } else {
          bot.sendMessage(msg.chat.id, 'Format pesan salah. Pastikan Anda mengikuti format yang diberikan.');
        }
      } else {
        bot.sendMessage(msg.chat.id, 'Format pesan salah. Pastikan Anda mengikuti format yang diberikan.');
      }
    } else {
      bot.sendMessage(msg.chat.id, 'Terima kasih atas informasinya. Mohon balas pesan ini dengan format yang diberikan untuk melanjutkan pembayaran.');
    }
  }
});


// Handler untuk menangani pesan dari pengguna yang sedang menunggu detail pembayaran
let lastPaymentErrorMessageChatId = null; // Mendefinisikan variabel lastPaymentErrorMessageChatId

// Handler untuk menangani pesan dari pengguna yang sedang menunggu detail pembayaran
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username; // Menyimpan username pengguna
  const text = msg.text;
  const timestamp = new Date().toISOString(); // Mendapatkan timestamp dalam format ISO

  // Check if the user is waiting for payment details
  if (waitingForPaymentDetails[userId]) {
    // Extract payment details from the user's reply
    const zptMatch = text.match(/ID ZPT: ([\w\d.-]+)\n?/); // Updated regular expression for ZPT ID
    const swordsMatch = text.match(/Nama Sword: ([\w\d\s,.-]+)/); // Updated regular expression for swords name

    if (zptMatch && swordsMatch) {
      const zptId = zptMatch[1].trim();
      const swordsNames = swordsMatch[1].trim().split(',').map(sword => sword.trim()); // Split swords by comma and trim whitespace

      // Validate payment details
      if (!zptId || !swordsNames.length) {
        // Send error message only if it's a new chat or the previous error message was sent to a different chat
        if (chatId !== lastPaymentErrorMessageChatId) {
          bot.sendMessage(chatId, "Format yang Anda masukkan tidak sesuai. Silahkan balas pesan ini dengan format yang benar. example: \n\nID ZPT: Masukan ID zpt mu dengan benar\nNama Sword: japan sword, royal blade");
          lastPaymentErrorMessageChatId = chatId;
        }
        return;
      }

      // Prepare data for each sword
      const dataToSave = {
        user_id: userId,
        username: username, // Menambah username pengguna ke dalam data
        zpt_id: zptId,
        swords_name: swordsNames.join(', '), // Gabungkan nama-nama sword menjadi satu string dengan koma
        timestamp: timestamp
      };

      try {
        // Insert data into Supabase table
        const { data, error } = await supabase.from('payment_details').insert(dataToSave);
        if (error) {
          console.error("Error saving payment details to Supabase:", error.message);
          bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam menyimpan detail pembayaran.");
        } else {
          // Send confirmation message
          bot.sendMessage(chatId, "Detail pembayaran berhasil disimpan. Pembelian Anda sedang diproses dan akan di kirim dalam waktu 1x24 jam. Anda akan menerima pemberitahuan setelah proses pengiriman selesai.");
        }
      } catch (error) {
        console.error("Error saving payment details to Supabase:", error.message);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam menyimpan detail pembayaran.");
      }

      // Clear user state and remove from waiting list
      delete waitingForPaymentDetails[userId];
      lastPaymentErrorMessageChatId = null; // Reset error message chat ID
    } else {
      // Send error message only if it's a new chat or the previous error message was sent to a different chat
      if (chatId !== lastPaymentErrorMessageChatId) {
        bot.sendMessage(chatId, "Format yang Anda masukkan tidak sesuai. Silahkan balas pesan ini dengan format yang benar. example: \n\nID ZPT: Masukan ID zpt mu dengan benar\nNama Sword: japan sword, royal blade");
        lastPaymentErrorMessageChatId = chatId;
      }
    }
  }
});

//list admin commands
// /additem  // kirimpesan

// Handler untuk command /kirimpesan
bot.onText(/^\/kirimpesan$/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Check if the user is an admin
  if (isAdmin(userId)) {
    bot.sendMessage(chatId, "Masukkan ID pengguna yang akan Anda kirimkan pesan.");
    
    // Menunggu ID pengguna dari admin
    bot.once('message', (msg) => {
      const targetUserId = msg.text;

      // Meminta pesan yang akan dikirimkan
      bot.sendMessage(chatId, "Masukkan pesan yang akan Anda kirimkan.");

      // Menunggu pesan dari admin
      bot.once('message', (msg) => {
        const messageToSend = msg.text;

        // Kirim pesan ke pengguna yang bersangkutan
        bot.sendMessage(targetUserId, messageToSend)
          .then(() => {
            // Konfirmasi kepada admin bahwa pesan telah berhasil dikirim
            bot.sendMessage(chatId, "Pesan berhasil dikirim.");
          })
          .catch((error) => {
            console.error("Error sending message:", error.message);
            bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam mengirim pesan.");
          });
      });
    });
  } else {
    bot.sendMessage(chatId, "Anda tidak memiliki izin untuk menggunakan perintah ini.");
  }
});

// Function to handle messages and prevent spam
const userSpamCooldown = {}; // Store the last message timestamp of each user

bot.on('message', (msg) => {
  const userId = msg.from.id;
  const currentTime = new Date().getTime();

  // Check if the user has sent a message before
  if (userSpamCooldown[userId] && currentTime - userSpamCooldown[userId] < 3000) {
    // If yes, inform the user not to spam
    bot.sendMessage(userId, "Tunggu sebentar sebelum mengirim pesan berikutnya.");
    return;
  }

  // Store the last message timestamp of the user
  userSpamCooldown[userId] = currentTime;

  // Process the user's message here
});

bot.setMyCommands(commands)
  .then(() => console.log('Commands set successfully!'))
  .catch(error => console.error('Error setting commands:', error.message));

// Function to check if the user is an admin
const adminIds = ['1722091990']; // Replace with your admin IDs
function isAdmin(userId) {
  return adminIds.includes(userId.toString());
}

const adminChatId = '1722091990'; // Change this to the admin's chat ID

// Function to forward messages from users to the admin
bot.on("message", (msg) => {
  // Check if the message is from a user (not from the admin)
  if (msg.from.id.toString() !== adminChatId) {
    // Get the current time
    const currentTime = moment().format("HH:mm:ss"); // Format time using moment
    
    // Prepare the message content with user's username, timestamp, and text
    const messageContent = `Pesan dari pengguna (ID: ${msg.from.id}, Username: ${msg.from.username}, Jam: ${currentTime}):\n${msg.text}`;
    
    // Forward the message to the admin
    bot.sendMessage(adminChatId, messageContent);

    // Log the user format and message
    console.log("Pesan dari pengguna:");
    console.log("ID Pengguna:", msg.from.id);
    console.log("Username Pengguna:", msg.from.username);
    console.log("Waktu:", currentTime);
    console.log("Isi Pesan:", msg.text);
  }
});

// Handler untuk command /additem
bot.onText(/^\/additem$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Periksa apakah pengguna adalah admin
  if (isAdmin(userId)) {
    const response = "Silahkan masukkan detail item (nama, harga)";
    bot.sendMessage(chatId, response);

    // Mendengarkan pesan dari pengguna untuk mendapatkan detail item
    const messageListener = async (msg) => {
      if (msg.text) {
        const itemDetails = msg.text.split(","); // Pisahkan pesan dengan koma untuk mendapatkan detail item
        if (itemDetails.length === 2) { // Pastikan semua detail diberikan
          const [name, price] = itemDetails;

          // Masukkan detail item ke dalam Supabase
          try {
            const { data, error } = await supabase
              .from('item')
              .insert([{ name, price }]);
            if (error) {
              console.error("Error adding item to Supabase:", error.message);
              bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam menambahkan item.");
            } else {
              bot.sendMessage(chatId, "Item berhasil ditambahkan.");
            }
          } catch (error) {
            console.error("Error adding item to Supabase:", error.message);
            bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam menambahkan item.");
          }

          // Hentikan mendengarkan pesan setelah menerima satu
          bot.removeListener("message", messageListener);
        } else {
          bot.sendMessage(chatId, "Format pesan tidak valid. Mohon masukkan detail item dengan format: nama, harga.");
        }
      }
    };

    // Tambahkan listener pesan
    bot.on("message", messageListener);

    // Hapus listener pesan setelah 1 menit
    setTimeout(() => {
      bot.removeListener("message", messageListener);
    }, 60000); // 1 menit dalam milidetik
  } else {
    const response = "Anda tidak memiliki izin untuk menambahkan item baru.";
    bot.sendMessage(chatId, response); // Kirim respon ke pengguna non-admin
  }
});


// Function to handle /sword command
bot.onText(/^\/listitem$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const { data, error } = await supabase.from('item').select('*');
    if (error) {
      console.error("Error retrieving items from Supabase:", error.message);
      bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam mengambil data item.");
      return;
    }

    if (!data || data.length === 0) {
      bot.sendMessage(chatId, "Belum ada item tersedia. Silahkan tunggu admin menambahkannya.");
      return;
    }

    data.forEach(async (item) => {
      const itemMessage = `${item.name}\nHarga: ${item.price}`;
      bot.sendMessage(chatId, itemMessage);
    });
  } catch (error) {
    console.error("Error retrieving items from Supabase:", error.message);
    bot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam mengambil data item.");
  }
});

console.log("Bot is running. Send a message to start!");
